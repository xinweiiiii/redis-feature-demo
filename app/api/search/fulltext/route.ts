import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Perform full-text search using FT.SEARCH
    // Clean and prepare the query
    const cleanQuery = query.trim().toLowerCase();

    // For simple searches, just search across all TEXT fields
    // This will search in both name and description fields
    const results = await client.ft.search('idx:products', cleanQuery, {
      LIMIT: { from: 0, size: limit },
      RETURN: ['name', 'description', 'category', 'price'],
    });

    const documents = results.documents.map((doc: any) => ({
      id: doc.id,
      ...doc.value,
    }));

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
