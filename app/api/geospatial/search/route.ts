import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { latitude, longitude, radius } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radius !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input: latitude, longitude, and radius are required' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // Use sendCommand to get the raw response with WITHDIST and WITHCOORD
    const rawResults = await redis.sendCommand([
      'GEOSEARCH',
      'locations',
      'FROMLONLAT',
      longitude.toString(),
      latitude.toString(),
      'BYRADIUS',
      radius.toString(),
      'km',
      'WITHDIST',
      'WITHCOORD'
    ]) as any;

    console.log('Raw geoSearch results:', JSON.stringify(rawResults, null, 2));

    // Parse the raw results
    // Format: [[name, distance, [lon, lat]], ...]
    const formattedResults = (Array.isArray(rawResults) ? rawResults : []).map((result: any) => {
      if (Array.isArray(result) && result.length >= 3) {
        const [name, distance, coords] = result;
        return {
          name: name,
          distance: parseFloat(distance),
          longitude: parseFloat(coords[0]),
          latitude: parseFloat(coords[1]),
        };
      }
      return null;
    }).filter(r => r !== null);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      results: formattedResults,
      executionTime,
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
}
