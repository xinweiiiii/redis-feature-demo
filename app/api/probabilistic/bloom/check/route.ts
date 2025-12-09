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

    // Initialize Bloom Filter if it doesn't exist
    try {
      await redis.bf.reserve('passwordlist:bloom', 0.001, 10000);
    } catch (error) {
      // Ignore error if already exists
    }

    // Check if item exists in Bloom Filter
    const exists = await redis.bf.exists('passwordlist:bloom', item);

    return NextResponse.json({
      success: true,
      exists: exists === true,
      item,
      explanation: exists === true
        ? 'Item might exist (or could be false positive)'
        : 'Item definitely does NOT exist'
    });

  } catch (error) {
    console.error('Error checking Bloom Filter:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check item in Bloom Filter'
    }, { status: 500 });
  }
}
