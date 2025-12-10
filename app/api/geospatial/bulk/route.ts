import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { locations } = await request.json();

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: locations array is required' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // Format locations for Redis GEOADD
    const geoMembers = locations.map((loc: any) => ({
      longitude: loc.longitude,
      latitude: loc.latitude,
      member: loc.name,
    }));

    // Add all locations in one command
    const count = await redis.geoAdd('locations', geoMembers);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      count,
      executionTime,
    });
  } catch (error) {
    console.error('Error bulk adding locations:', error);
    return NextResponse.json(
      { error: 'Failed to bulk add locations' },
      { status: 500 }
    );
  }
}
