import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { dbHelpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { key, data } = await request.json();
    const client = await getRedisClient();

    // Write to Redis
    const cacheStartTime = performance.now();
    await client.hSet(key, data);
    const cacheTime = performance.now() - cacheStartTime;

    // Write to Database
    const dbStartTime = performance.now();
    await Promise.all(
      Object.entries(data).map(([field, value]) =>
        dbHelpers.setHash(key, field, String(value))
      )
    );
    const dbTime = performance.now() - dbStartTime;

    return NextResponse.json({
      success: true,
      message: `Hash set successfully`,
      cacheTime,
      dbTime,
      executionTime: cacheTime + dbTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const useCache = searchParams.get('useCache') !== 'false';

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    let data: Record<string, string> = {};
    let cacheTime = 0;
    let dbTime = 0;
    let source = '';

    if (useCache) {
      // Try cache first
      const cacheStartTime = performance.now();
      data = await client.hGetAll(key);
      cacheTime = performance.now() - cacheStartTime;

      if (Object.keys(data).length > 0) {
        source = 'cache';
      } else {
        // Cache miss - read from DB
        const dbStartTime = performance.now();
        data = await dbHelpers.getAllHash(key);
        dbTime = performance.now() - dbStartTime;
        source = 'database';

        // Populate cache
        if (Object.keys(data).length > 0) {
          await client.hSet(key, data);
        }
      }
    } else {
      // Read directly from database
      const dbStartTime = performance.now();
      data = await dbHelpers.getAllHash(key);
      dbTime = performance.now() - dbStartTime;
      source = 'database';
    }

    return NextResponse.json({
      data,
      cacheTime,
      dbTime,
      totalTime: cacheTime + dbTime,
      source,
      fromCache: source === 'cache',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
