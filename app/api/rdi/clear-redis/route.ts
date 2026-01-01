import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    console.log('========================================');
    console.log('MANUAL REDIS CLEANUP');
    console.log('========================================');

    const redis = await getRedisClient();

    // Get all customer IDs from Redis timeline
    const customerIds = await redis.zRange('customers:timeline', 0, -1);
    const count = customerIds.length;
    console.log(`Found ${count} customers in Redis to delete`);

    // Delete customer hashes from Redis
    if (customerIds.length > 0) {
      console.log(`Deleting ${customerIds.length} customer hashes from Redis...`);
      const deletePromises = customerIds.map((id) => {
        console.log(`Deleting customer:${id}`);
        return redis.del(`customer:${id}`);
      });
      const deletedHashes = await Promise.all(deletePromises);
      console.log(`✓ Deleted ${deletedHashes.reduce((a, b) => a + b, 0)} customer hashes from Redis`);
    }

    // Delete the timeline sorted set
    const timelineDeleted = await redis.del('customers:timeline');
    console.log(`✓ Timeline sorted set deleted: ${timelineDeleted}`);

    // Verify Redis deletion
    const remainingIds = await redis.zRange('customers:timeline', 0, -1);
    console.log(`✓ Redis customers remaining: ${remainingIds.length}`);

    console.log('\n========================================');
    console.log('✓ REDIS CLEANUP COMPLETE');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Redis data manually cleared',
      deletedCount: count,
      verification: {
        redisRemaining: remainingIds.length
      }
    });
  } catch (error: any) {
    console.error('❌ Error during Redis cleanup:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to clear Redis', details: error.message },
      { status: 500 }
    );
  }
}
