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

    // Get positions for all members using sendCommand
    const positions = await redis.sendCommand(['GEOPOS', 'locations', ...members]) as any;

    // Combine members with their positions
    // GEOPOS returns array of [longitude, latitude] pairs or null for each member
    const locations = members.map((name, index) => {
      const pos = positions[index];
      return pos && Array.isArray(pos) && pos.length === 2
        ? {
            name,
            longitude: parseFloat(pos[0]),
            latitude: parseFloat(pos[1]),
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
