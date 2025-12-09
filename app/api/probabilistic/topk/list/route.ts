import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const redis = await getRedisClient();

    // Initialize Top-K if it doesn't exist
    try {
      await redis.topK.reserve('trending:topk', 10);
    } catch (error) {
      // Ignore error if already exists
    }

    // Get top-k items
    const items = await redis.topK.list('trending:topk');

    return NextResponse.json({
      success: true,
      items,
      count: items.length
    });

  } catch (error) {
    console.error('Error getting Top-K list:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get Top-K list'
    }, { status: 500 });
  }
}
