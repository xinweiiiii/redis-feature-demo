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

    // Initialize Bloom Filter if it doesn't exist (0.01% error rate, 10000 items)
    try {
      await redis.bf.reserve('passwordlist:bloom', 0.001, 10000);
    } catch (error) {
      // Ignore error if already exists
    }

    // Add item to Bloom Filter
    const result = await redis.bf.add('passwordlist:bloom', item);

    return NextResponse.json({
      success: true,
      added: result === true,
      message: result === true
        ? 'Password added to breach database'
        : 'Password already exists in database',
      item
    });

  } catch (error) {
    console.error('Error adding to Bloom Filter:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add item to Bloom Filter'
    }, { status: 500 });
  }
}
