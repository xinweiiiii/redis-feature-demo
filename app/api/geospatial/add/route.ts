import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { name, latitude, longitude } = await request.json();

    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input: name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // Add location to Redis GEO
    await redis.geoAdd('locations', {
      longitude,
      latitude,
      member: name,
    });

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      name,
      executionTime,
    });
  } catch (error) {
    console.error('Error adding location:', error);
    return NextResponse.json(
      { error: 'Failed to add location' },
      { status: 500 }
    );
  }
}
