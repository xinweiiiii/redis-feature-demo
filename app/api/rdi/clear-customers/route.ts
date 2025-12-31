import { NextRequest, NextResponse } from 'next/server';
import { customerHelpers } from '@/lib/postgres';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Get Redis client
    const redis = await getRedisClient();

    // Get all customer IDs from Redis first
    const customerIds = await redis.zRange('customers:timeline', 0, -1);

    // Delete customer hashes from Redis
    if (customerIds.length > 0) {
      const deletePromises = customerIds.map((id) => redis.del(`customer:${id}`));
      await Promise.all(deletePromises);
    }

    // Delete the timeline sorted set
    await redis.del('customers:timeline');

    // Delete all customers from PostgreSQL
    await customerHelpers.deleteAllCustomers();

    return NextResponse.json({
      success: true,
      message: 'All customers cleared from PostgreSQL and Redis',
      deletedCount: customerIds.length,
    });
  } catch (error: any) {
    console.error('Error clearing customers:', error);
    return NextResponse.json(
      { error: 'Failed to clear customers', details: error.message },
      { status: 500 }
    );
  }
}
