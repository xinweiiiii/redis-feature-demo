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

    // Initialize Count-Min Sketch if it doesn't exist
    try {
      await redis.cms.initByDim('pageviews:cms', 2000, 5);
    } catch (error) {
      // Ignore error if already exists
    }

    // Query item frequency in Count-Min Sketch
    const result = await redis.cms.query('pageviews:cms', item);
    const frequency = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({
      success: true,
      item,
      frequency,
      explanation: 'Count-Min Sketch may slightly overestimate, but never underestimates'
    });

  } catch (error) {
    console.error('Error querying Count-Min Sketch:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query item'
    }, { status: 500 });
  }
}
