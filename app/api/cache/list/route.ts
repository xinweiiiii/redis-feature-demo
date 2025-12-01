import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, values } = await request.json();
    const client = await getRedisClient();

    const startTime = performance.now();
    const length = await client.rPush(key, values);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `List updated successfully. New length: ${length}. Time: ${executionTime.toFixed(2)}ms`,
      executionTime,
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
    const startTime = performance.now();
    const data = await client.lRange(key, 0, -1);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      data,
      executionTime,
      fromCache: data.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
