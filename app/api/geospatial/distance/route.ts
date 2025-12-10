import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { from, to } = await request.json();

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Invalid input: from and to locations are required' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // Calculate distance between two locations
    const distanceResult = await redis.geoDist('locations', from, to, 'km');

    if (distanceResult === null) {
      return NextResponse.json(
        { error: 'One or both locations not found' },
        { status: 404 }
      );
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      from,
      to,
      distance: parseFloat(distanceResult as any),
      executionTime,
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}
