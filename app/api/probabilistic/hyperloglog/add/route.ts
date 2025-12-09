import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Add user to HyperLogLog counters
    await Promise.all([
      redis.pfAdd('visitors:today', userId),
      redis.pfAdd('visitors:week', userId),
      redis.pfAdd('visitors:month', userId)
    ]);

    // Get updated counts
    const [uniqueToday, uniqueWeek, uniqueMonth] = await Promise.all([
      redis.pfCount('visitors:today'),
      redis.pfCount('visitors:week'),
      redis.pfCount('visitors:month')
    ]);

    return NextResponse.json({
      success: true,
      message: `Visitor ${userId} tracked`,
      uniqueToday,
      uniqueWeek,
      uniqueMonth
    });

  } catch (error) {
    console.error('Error adding to HyperLogLog:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add visitor'
    }, { status: 500 });
  }
}
