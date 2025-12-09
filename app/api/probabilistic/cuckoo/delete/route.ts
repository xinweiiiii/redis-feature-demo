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

    // Delete item from Cuckoo Filter
    const result = await redis.cf.del('blocklist:cuckoo', item);

    return NextResponse.json({
      success: true,
      deleted: result === true,
      message: result === true
        ? `IP ${item} removed from blocklist`
        : `IP ${item} was not in blocklist`,
      item
    });

  } catch (error) {
    console.error('Error deleting from Cuckoo Filter:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete item from Cuckoo Filter'
    }, { status: 500 });
  }
}
