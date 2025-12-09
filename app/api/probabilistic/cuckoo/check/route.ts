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

    // Initialize Cuckoo Filter if it doesn't exist
    try {
      await redis.cf.reserve('blocklist:cuckoo', 10000);
    } catch (error) {
      // Ignore error if already exists
    }

    // Check if item exists in Cuckoo Filter
    const exists = await redis.cf.exists('blocklist:cuckoo', item);

    return NextResponse.json({
      success: true,
      exists: exists === true,
      item,
      status: exists === true ? 'BLOCKED' : 'ALLOWED'
    });

  } catch (error) {
    console.error('Error checking Cuckoo Filter:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check item in Cuckoo Filter'
    }, { status: 500 });
  }
}
