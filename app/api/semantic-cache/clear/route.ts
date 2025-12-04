import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

const CACHE_KEY_PREFIX = 'semantic-cache:';

export async function POST(request: NextRequest) {
  try {
    const client = await getRedisClient();
    const startTime = performance.now();

    // Get all cache keys
    const cacheKeys = await client.keys(`${CACHE_KEY_PREFIX}*`);

    // Delete all cache entries
    if (cacheKeys.length > 0) {
      await client.del(cacheKeys);
    }

    const executionTime = performance.now() - startTime;

    console.log('[Semantic Cache] Cleared', cacheKeys.length, 'entries');

    return NextResponse.json({
      success: true,
      message: `Cleared ${cacheKeys.length} cache entries`,
      deletedCount: cacheKeys.length,
      executionTime,
    });
  } catch (error) {
    console.error('[Semantic Cache Clear] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
