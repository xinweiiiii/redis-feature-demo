import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

const CACHE_KEY_PREFIX = 'semantic-cache:';

export async function POST(request: NextRequest) {
  try {
    const client = await getRedisClient();
    const startTime = performance.now();

    // Get all cache entries
    const cacheKeys = await client.keys(`${CACHE_KEY_PREFIX}*`);
    const totalEntries = cacheKeys.length;

    let totalTokensSaved = 0;
    let entries: Array<{
      query: string;
      response: string;
      tokens: number;
      model: string;
      timestamp: string;
    }> = [];

    // Get details of recent entries
    for (const key of cacheKeys.slice(0, 10)) {
      const cached = await client.hGetAll(key);

      if (cached.query) {
        entries.push({
          query: cached.query,
          response: cached.response || '',
          tokens: parseInt(cached.tokens || '0'),
          model: cached.model || '',
          timestamp: cached.timestamp || '',
        });

        totalTokensSaved += parseInt(cached.tokens || '0');
      }
    }

    const executionTime = performance.now() - startTime;

    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      stats: {
        totalEntries,
        totalTokensSaved,
        recentEntries: entries,
      },
      executionTime,
    });
  } catch (error) {
    console.error('[Semantic Cache Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
