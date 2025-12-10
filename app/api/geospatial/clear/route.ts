import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    const redis = await getRedisClient();

    // Delete the locations key
    await redis.del(['locations']);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing locations:', error);
    return NextResponse.json(
      { error: 'Failed to clear locations' },
      { status: 500 }
    );
  }
}
