import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { identifier, limit, windowSeconds } = await request.json();

    if (!identifier || !limit || !windowSeconds) {
      return NextResponse.json(
        { success: false, error: 'Identifier, limit, and windowSeconds are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const key = `rate_limit:${identifier}`;
    const startTime = performance.now();

    // Get current count
    const currentCountStr = await client.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

    let allowed = false;
    let newCount = currentCount;
    let ttl = await client.ttl(key);

    if (currentCount < limit) {
      // Increment counter
      newCount = await client.incr(key);

      // Set expiry on first request
      if (newCount === 1) {
        await client.expire(key, windowSeconds);
        ttl = windowSeconds;
      } else {
        ttl = await client.ttl(key);
      }

      allowed = true;
    } else {
      // Already at limit
      allowed = false;
      ttl = await client.ttl(key);
    }

    const executionTime = performance.now() - startTime;
    const remaining = Math.max(0, limit - newCount);
    const resetTime = ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null;

    return NextResponse.json({
      success: true,
      allowed,
      limit,
      current: newCount,
      remaining,
      resetInSeconds: ttl > 0 ? ttl : 0,
      resetTime,
      executionTime,
      message: allowed
        ? `Request allowed (${newCount}/${limit})`
        : `Rate limit exceeded. Try again in ${ttl}s`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
