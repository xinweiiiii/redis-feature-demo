import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { generateOpenAIEmbedding } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      limit = 10,
      threshold = 0.7,
      useFullText = true,
      useVector = true,
      geoFilter,
      categoryFilter,
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Build hybrid search query
    let searchQuery = '';
    const params: any = {};

    // Add category filter if provided
    if (categoryFilter) {
      searchQuery += `@category:{${categoryFilter}} `;
    }

    // Add geospatial filter if provided
    if (geoFilter) {
      searchQuery += `@location:[${geoFilter.longitude} ${geoFilter.latitude} ${geoFilter.radius} ${geoFilter.unit || 'km'}] `;
    }

    // Combine full-text and vector search
    if (useFullText && useVector) {
      // Generate embedding for vector search using OpenAI
      const queryEmbedding = await generateOpenAIEmbedding(query);
      const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);
      params.BLOB = embeddingBlob;

      // Hybrid query: full-text + vector similarity
      searchQuery += `(${query}) =>[KNN ${limit} @embedding $BLOB AS vector_distance]`;
    } else if (useFullText) {
      // Full-text only
      searchQuery += query;
    } else if (useVector) {
      // Vector only using OpenAI
      const queryEmbedding = await generateOpenAIEmbedding(query);
      const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);
      params.BLOB = embeddingBlob;
      searchQuery += `*=>[KNN ${limit} @embedding $BLOB AS vector_distance]`;
    } else {
      searchQuery += '*';
    }

    // Execute hybrid search
    const searchOptions: any = {
      LIMIT: { from: 0, size: useVector ? limit * 2 : limit },
    };

    if (Object.keys(params).length > 0) {
      searchOptions.PARAMS = params;
      searchOptions.DIALECT = 2;
      searchOptions.SORTBY = 'vector_distance';
      searchOptions.RETURN = ['name', 'description', 'category', 'price', 'vector_distance'];
    }

    const results = await client.ft.search('idx:products', searchQuery.trim(), searchOptions);

    // Filter by similarity threshold if using vector search
    let documents = results.documents.map((doc: any) => {
      const docData: any = {
        id: doc.id,
        ...doc.value,
      };

      // Calculate similarity from distance if vector search is used
      if (useVector && doc.value.vector_distance !== undefined) {
        const distance = parseFloat(doc.value.vector_distance || '1');
        const similarity = 1 - distance;
        docData.similarity = similarity.toFixed(3);
      }

      return docData;
    });

    // Apply threshold filtering for vector searches
    if (useVector) {
      documents = documents
        .filter((doc: any) => !doc.similarity || parseFloat(doc.similarity) >= threshold)
        .slice(0, limit);
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      documents,
      total: results.total,
      searchType: {
        fullText: useFullText,
        vector: useVector,
        geo: !!geoFilter,
        category: !!categoryFilter,
      },
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
