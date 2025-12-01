import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, data } = await request.json();
    const client = await getRedisClient();

    const startTime = performance.now();
    await client.hSet(key, data);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Hash set successfully in ${executionTime.toFixed(2)}ms`,
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
    const data = await client.hGetAll(key);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      data,
      executionTime,
      fromCache: Object.keys(data).length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
