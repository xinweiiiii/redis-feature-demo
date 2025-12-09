import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const redis = await getRedisClient();

    // Get unique visitor counts for different time periods
    const [uniqueToday, uniqueWeek, uniqueMonth] = await Promise.all([
      redis.pfCount('visitors:today'),
      redis.pfCount('visitors:week'),
      redis.pfCount('visitors:month')
    ]);

    return NextResponse.json({
      success: true,
      uniqueToday,
      uniqueWeek,
      uniqueMonth,
      memoryUsed: '12KB per HyperLogLog'
    });

  } catch (error) {
    console.error('Error counting HyperLogLog:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get visitor counts'
    }, { status: 500 });
  }
}
