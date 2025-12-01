import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, members } = await request.json();
    const client = await getRedisClient();

    const startTime = performance.now();
    const added = await client.sAdd(key, members);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `${added} member(s) added to set in ${executionTime.toFixed(2)}ms`,
      executionTime,
      added,
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
    const data = await client.sMembers(key);
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
