import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identifier is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const key = `rate_limit:${identifier}`;

    const countStr = await client.get(key);
    const count = countStr ? parseInt(countStr) : 0;
    const ttl = await client.ttl(key);

    return NextResponse.json({
      success: true,
      current: count,
      resetInSeconds: ttl > 0 ? ttl : 0,
      resetTime: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
