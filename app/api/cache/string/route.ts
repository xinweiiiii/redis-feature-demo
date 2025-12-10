import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { dbHelpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { key, value, ttl } = await request.json();
    const client = await getRedisClient();

    // Write to Redis
    const cacheStartTime = performance.now();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    const cacheTime = performance.now() - cacheStartTime;

    // Write to Database
    const dbStartTime = performance.now();
    await dbHelpers.setString(key, value);
    const dbTime = performance.now() - dbStartTime;

    return NextResponse.json({
      success: true,
      message: `String set successfully`,
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
    const useCache = searchParams.get('useCache') !== 'false'; // Default to true

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    let data = null;
    let cacheTime = 0;
    let dbTime = 0;
    let source = '';

    if (useCache) {
      // Try cache first
      const cacheStartTime = performance.now();
      data = await client.get(key);
      cacheTime = performance.now() - cacheStartTime;

      if (data !== null) {
        source = 'cache';
      } else {
        // Cache miss - read from DB
        const dbStartTime = performance.now();
        data = await dbHelpers.getString(key);
        dbTime = performance.now() - dbStartTime;
        source = 'database';

        // Populate cache for next time
        if (data !== null) {
          await client.set(key, data);
        }
      }
    } else {
      // Read directly from database (no cache)
      const dbStartTime = performance.now();
      data = await dbHelpers.getString(key);
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
