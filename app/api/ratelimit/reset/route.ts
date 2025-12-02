import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Identifier is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const key = `rate_limit:${identifier}`;

    await client.del(key);

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for ${identifier}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
