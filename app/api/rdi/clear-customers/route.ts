import { NextRequest, NextResponse } from 'next/server';
import { customerHelpers } from '@/lib/postgres';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // STEP 1: Delete from PostgreSQL (Source Database)
    console.log('========================================');
    console.log('STEP 1: Deleting customers from PostgreSQL (Source Database)...');
    console.log('========================================');

    const pgStartTime = performance.now();
    await customerHelpers.deleteAllCustomers();
    const pgDeleteTime = (performance.now() - pgStartTime).toFixed(2);

    console.log('✓ PostgreSQL deletion complete');

    // Verify PostgreSQL deletion
    const pgCount = await customerHelpers.getCustomersCount();
    console.log(`✓ PostgreSQL customers remaining: ${pgCount}`);

    // STEP 2: RDI simulates Change Data Capture (CDC) and syncs to Redis
    console.log('\n========================================');
    console.log('STEP 2: RDI detecting changes and syncing to Redis (Target Cache)...');
    console.log('========================================');

    const redis = await getRedisClient();
    const rdiStartTime = performance.now();

    // Get all customer IDs from Redis timeline
    const customerIds = await redis.zRange('customers:timeline', 0, -1);
    const count = customerIds.length;
    console.log(`RDI detected ${count} customers to remove from Redis`);

    // RDI propagates deletions to Redis
    if (customerIds.length > 0) {
      console.log(`RDI syncing: Deleting ${customerIds.length} customer hashes from Redis...`);
      const deletePromises = customerIds.map((id) => redis.del(`customer:${id}`));
      const deletedHashes = await Promise.all(deletePromises);
      console.log(`✓ RDI synced: Deleted ${deletedHashes.reduce((a, b) => a + b, 0)} customer hashes`);
    }

    // RDI deletes the timeline sorted set
    const timelineDeleted = await redis.del('customers:timeline');
    console.log(`✓ RDI synced: Timeline sorted set deleted`);

    const rdiSyncTime = (performance.now() - rdiStartTime).toFixed(2);

    // Verify Redis deletion
    const remainingIds = await redis.zRange('customers:timeline', 0, -1);
    console.log(`✓ Redis customers remaining: ${remainingIds.length}`);

    console.log('\n========================================');
    console.log('✓ RDI SYNC COMPLETE');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Customers deleted from PostgreSQL and automatically synced to Redis via RDI',
      deletedCount: count,
      metrics: {
        postgresDeleteTime: parseFloat(pgDeleteTime),
        rdiSyncTime: parseFloat(rdiSyncTime),
        totalTime: parseFloat(pgDeleteTime) + parseFloat(rdiSyncTime)
      },
      verification: {
        postgresRemaining: pgCount,
        redisRemaining: remainingIds.length
      }
    });
  } catch (error: any) {
    console.error('❌ Error during delete operation:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to clear customers', details: error.message },
      { status: 500 }
    );
  }
}
