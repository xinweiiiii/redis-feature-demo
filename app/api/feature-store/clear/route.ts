import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    // Get all users
    const userIds = await redis.sMembers('feature_store:users');

    if (userIds && userIds.length > 0) {
      const keysToDelete: string[] = [];

      userIds.forEach((userId: string) => {
        keysToDelete.push(
          `features:${userId}`,
          `transactions:${userId}`,
          `devices:${userId}`,
          `ips:${userId}`,
          `account_age:${userId}`,
          `failed_logins:${userId}`,
          `last_tx:${userId}`
        );
      });

      // Delete all user-related keys
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    }

    // Delete global keys
    await redis.del('feature_store:users', 'feature_store:total_transactions');

    return NextResponse.json({
      success: true,
      message: 'All feature store data cleared'
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear data'
    }, { status: 500 });
  }
}
