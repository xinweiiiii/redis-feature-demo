import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    const { item } = await request.json();

    if (!item) {
      return NextResponse.json({
        success: false,
        error: 'Item is required'
      }, { status: 400 });
    }

    // Initialize Count-Min Sketch if it doesn't exist (width: 2000, depth: 5)
    try {
      await redis.cms.initByDim('pageviews:cms', 2000, 5);
    } catch (error) {
      // Ignore error if already exists
    }

    // Increment item count in Count-Min Sketch
    const result = await redis.cms.incrBy('pageviews:cms', { item, incrementBy: 1 });
    const frequency = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({
      success: true,
      item,
      frequency,
      message: `${item} incremented to ${frequency}`
    });

  } catch (error) {
    console.error('Error incrementing Count-Min Sketch:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to increment item'
    }, { status: 500 });
  }
}
