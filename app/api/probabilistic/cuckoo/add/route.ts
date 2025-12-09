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

    // Initialize Cuckoo Filter if it doesn't exist (10000 items capacity)
    try {
      await redis.cf.reserve('blocklist:cuckoo', 10000);
    } catch (error) {
      // Ignore error if already exists
    }

    // Add item to Cuckoo Filter
    const result = await redis.cf.add('blocklist:cuckoo', item);

    return NextResponse.json({
      success: true,
      added: result === true,
      message: result === true
        ? `IP ${item} added to blocklist`
        : `IP ${item} already in blocklist`,
      item
    });

  } catch (error) {
    console.error('Error adding to Cuckoo Filter:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add item to Cuckoo Filter'
    }, { status: 500 });
  }
}
