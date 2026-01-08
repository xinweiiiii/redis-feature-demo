import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { generateOpenAIEmbedding } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      limit = 10,
      threshold = 0.5,
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

      // Hybrid query: Use wildcard for base query, then add KNN vector search
      // This allows vector similarity to work while still considering the text in scoring
      searchQuery += `*=>[KNN ${limit * 2} @embedding $BLOB AS vector_distance]`;
    } else if (useFullText) {
      // Full-text only
      searchQuery += query;
    } else if (useVector) {
      // Vector only using OpenAI
      const queryEmbedding = await generateOpenAIEmbedding(query);
      const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);
      params.BLOB = embeddingBlob;
      searchQuery += `*=>[KNN ${limit * 2} @embedding $BLOB AS vector_distance]`;
    } else {
      searchQuery += '*';
    }

    // Execute hybrid search
    const searchOptions: any = {
      LIMIT: { from: 0, size: useVector ? limit * 2 : limit },
      RETURN: ['name', 'description', 'category', 'price'],
    };

    if (Object.keys(params).length > 0) {
      searchOptions.PARAMS = params;
      searchOptions.DIALECT = 2;
    }

    // Only sort by vector_distance if doing vector search
    if (useVector) {
      searchOptions.SORTBY = 'vector_distance';
      searchOptions.RETURN.push('vector_distance');
    }

    const results = await client.ft.search('idx:products', searchQuery.trim(), searchOptions);

    // Process results and calculate hybrid scores
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

        // For hybrid search, boost score if text query matches
        if (useFullText && useVector) {
          const queryLower = query.toLowerCase();
          const nameMatch = doc.value.name?.toLowerCase().includes(queryLower);
          const descMatch = doc.value.description?.toLowerCase().includes(queryLower);

          // Boost similarity score for text matches
          if (nameMatch || descMatch) {
            const boost = nameMatch ? 0.15 : 0.1; // Higher boost for name matches
            docData.hybridScore = Math.min(1, parseFloat(docData.similarity) + boost).toFixed(3);
            docData.textMatch = true;
          } else {
            docData.hybridScore = docData.similarity;
            docData.textMatch = false;
          }
        }
      }

      return docData;
    });

    // Apply threshold filtering and sorting for vector/hybrid searches
    if (useVector) {
      documents = documents
        .filter((doc: any) => {
          // If no similarity score, include it (full-text only match)
          if (!doc.similarity) return true;
          // If has similarity score, check threshold
          return parseFloat(doc.similarity) >= threshold;
        });

      // Sort by hybrid score if doing hybrid search, otherwise by similarity
      if (useFullText && useVector) {
        documents.sort((a: any, b: any) => parseFloat(b.hybridScore || b.similarity || '0') - parseFloat(a.hybridScore || a.similarity || '0'));
      }

      documents = documents.slice(0, limit);
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      documents,
      total: documents.length, // Return actual count after filtering
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
