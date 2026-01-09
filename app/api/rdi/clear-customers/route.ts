import { NextResponse } from 'next/server';
import { customerHelpers } from '@/lib/postgres';
import { getRedisClient } from '@/lib/redis';

export async function POST() {
  try {
    const redis = await getRedisClient();

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

    // STEP 2: Manually clean up Redis (RDI may not handle bulk deletes immediately)
    console.log('\n========================================');
    console.log('STEP 2: Cleaning up Redis cache...');
    console.log('========================================');

    const redisStartTime = performance.now();
    const customerKeys = await redis.keys('customers:id:*');
    const count = customerKeys.length;

    if (customerKeys.length > 0) {
      console.log(`Deleting ${customerKeys.length} customer keys from Redis...`);
      await Promise.all(customerKeys.map(key => redis.del(key)));
      console.log(`✓ Deleted ${count} keys from Redis`);
    } else {
      console.log('✓ No customer keys found in Redis');
    }

    const redisDeleteTime = (performance.now() - redisStartTime).toFixed(2);

    // Verify Redis deletion
    const remainingKeys = await redis.keys('customers:id:*');
    console.log(`✓ Redis customers remaining: ${remainingKeys.length}`);
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      message: 'Customers deleted from PostgreSQL and Redis',
      deletedCount: count,
      metrics: {
        postgresDeleteTime: parseFloat(pgDeleteTime),
        redisDeleteTime: parseFloat(redisDeleteTime),
        totalTime: parseFloat(pgDeleteTime) + parseFloat(redisDeleteTime)
      },
      verification: {
        postgresRemaining: pgCount,
        redisRemaining: remainingKeys.length
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
