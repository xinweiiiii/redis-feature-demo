import { NextRequest, NextResponse } from 'next/server';
import { customerHelpers } from '@/lib/postgres';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Get Redis client
    const redis = await getRedisClient();

    // Get all customer IDs from Redis first
    const customerIds = await redis.zRange('customers:timeline', 0, -1);
    const count = customerIds.length;

    // Delete all customers from PostgreSQL FIRST
    // This ensures data consistency - if PG delete fails, Redis data remains intact
    console.log('Deleting customers from PostgreSQL...');
    await customerHelpers.deleteAllCustomers();
    console.log('PostgreSQL deletion complete');

    // Now delete from Redis
    console.log('Deleting customers from Redis...');

    // Delete customer hashes from Redis
    if (customerIds.length > 0) {
      const deletePromises = customerIds.map((id) => redis.del(`customer:${id}`));
      await Promise.all(deletePromises);
    }

    // Delete the timeline sorted set
    await redis.del('customers:timeline');
    console.log('Redis deletion complete');

    return NextResponse.json({
      success: true,
      message: 'All customers cleared from PostgreSQL and Redis',
      deletedCount: count,
    });
  } catch (error: any) {
    console.error('Error clearing customers:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to clear customers', details: error.message },
      { status: 500 }
    );
  }
}
