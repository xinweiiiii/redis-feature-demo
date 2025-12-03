import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { generateOpenAIEmbedding } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10, threshold = 0.3 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Generate embedding for the query using OpenAI
    const queryEmbedding = await generateOpenAIEmbedding(query);
    const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);

    // Perform vector similarity search using FT.SEARCH with KNN
    // Note: We fetch more results than needed to allow filtering by threshold
    const results = await client.ft.search(
      'idx:products',
      `*=>[KNN ${limit * 2} @embedding $BLOB AS distance]`,
      {
        PARAMS: {
          BLOB: embeddingBlob,
        },
        SORTBY: 'distance',
        DIALECT: 2,
        RETURN: ['name', 'description', 'category', 'distance'],
      }
    );

    // Filter by similarity threshold (COSINE distance: lower is more similar)
    // For COSINE similarity: similarity = 1 - distance
    const documents = results.documents
      .map((doc: any) => {
        const distance = parseFloat(doc.value.distance || '1');
        const similarity = 1 - distance;
        return {
          id: doc.id,
          ...doc.value,
          similarity: similarity.toFixed(3),
        };
      })
      .filter((doc: any) => parseFloat(doc.similarity) >= threshold)
      .slice(0, limit);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      documents,
      total: results.total,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
