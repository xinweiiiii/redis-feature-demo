import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, value, ttl } = await request.json();
    const client = await getRedisClient();

    const startTime = performance.now();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `String set successfully in ${executionTime.toFixed(2)}ms`,
      executionTime,
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
    const startTime = performance.now();
    const data = await client.get(key);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      data,
      executionTime,
      fromCache: data !== null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
