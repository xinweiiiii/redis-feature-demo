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

    // Initialize Top-K if it doesn't exist (top 10 items)
    try {
      await redis.topK.reserve('trending:topk', 10);
    } catch (error) {
      // Ignore error if already exists
    }

    // Add item to Top-K
    await redis.topK.add('trending:topk', item);

    // Get updated list
    const items = await redis.topK.list('trending:topk');

    return NextResponse.json({
      success: true,
      item,
      items,
      message: `Added ${item} to trending tracker`
    });

  } catch (error) {
    console.error('Error adding to Top-K:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add item to Top-K'
    }, { status: 500 });
  }
}
