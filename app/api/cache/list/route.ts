import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { dbHelpers } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { key, values } = await request.json();
    const client = await getRedisClient();

    // Write to Redis
    const cacheStartTime = performance.now();
    const length = await client.rPush(key, values);
    const cacheTime = performance.now() - cacheStartTime;

    // Write to Database
    const dbStartTime = performance.now();
    await Promise.all(values.map((v: string) => dbHelpers.pushList(key, v)));
    const dbTime = performance.now() - dbStartTime;

    return NextResponse.json({
      success: true,
      message: `List updated successfully. New length: ${length}`,
      cacheTime,
      dbTime,
      executionTime: cacheTime + dbTime,
      length,
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

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();

    // Always read from both cache and database for comparison
    // Read from cache
    const cacheStartTime = performance.now();
    const cacheData = await client.lRange(key, 0, -1);
    const cacheTime = performance.now() - cacheStartTime;

    // Read from database
    const dbStartTime = performance.now();
    const dbData = await dbHelpers.getList(key);
    const dbTime = performance.now() - dbStartTime;

    // If cache miss, populate cache for next time
    if (cacheData.length === 0 && dbData.length > 0) {
      await client.rPush(key, dbData);
    }

    return NextResponse.json({
      cacheResult: {
        data: cacheData,
        time: cacheTime,
        found: cacheData.length > 0,
      },
      dbResult: {
        data: dbData,
        time: dbTime,
        found: dbData.length > 0,
      },
      // For display purposes, use cache data if available, otherwise db data
      data: cacheData.length > 0 ? cacheData : dbData,
      speedup: dbTime > 0 && cacheTime > 0 ? dbTime / cacheTime : 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
