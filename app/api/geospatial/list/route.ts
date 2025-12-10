import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const redis = await getRedisClient();

    // Get all members from the locations geo set
    const members = await redis.zRange('locations', 0, -1);

    if (members.length === 0) {
      return NextResponse.json({ locations: [] });
    }

    // Get positions for all members
    const positions = await redis.geoPos('locations', members);

    // Combine members with their positions
    const locations = members.map((name, index) => {
      const pos = positions[index];
      return pos
        ? {
            name,
            latitude: parseFloat(pos.latitude),
            longitude: parseFloat(pos.longitude),
          }
        : null;
    }).filter(loc => loc !== null);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Error listing locations:', error);
    return NextResponse.json(
      { error: 'Failed to list locations' },
      { status: 500 }
    );
  }
}
