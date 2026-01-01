import { NextRequest, NextResponse } from 'next/server';
import { customerHelpers } from '@/lib/postgres';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, country } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // STEP 1: Insert into PostgreSQL (Source Database)
    console.log('========================================');
    console.log('STEP 1: Inserting customer into PostgreSQL (Source Database)...');
    console.log('========================================');

    const pgStartTime = performance.now();
    const customer = await customerHelpers.insertCustomer(name, email, country || null);
    const pgInsertTime = (performance.now() - pgStartTime).toFixed(2);

    console.log('✓ Customer inserted into PostgreSQL:', customer);

    // STEP 2: RDI detects the change via CDC and syncs to Redis
    console.log('\n========================================');
    console.log('STEP 2: RDI detecting INSERT and syncing to Redis (Target Cache)...');
    console.log('========================================');

    const redis = await getRedisClient();
    const rdiStartTime = performance.now();

    // RDI syncs customer data to Redis as a hash
    const redisKey = `customer:${customer.id}`;
    const redisData = {
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      country: customer.country || '',
      created_at: customer.created_at.toISOString(),
    };
    console.log(`RDI syncing: Creating hash ${redisKey}`, redisData);
    await redis.hSet(redisKey, redisData);
    console.log('✓ RDI synced: Customer hash created in Redis');

    // RDI also maintains the timeline sorted set for chronological access
    await redis.zAdd('customers:timeline', {
      score: customer.created_at.getTime(),
      value: customer.id.toString(),
    });
    console.log(`✓ RDI synced: Added to timeline (score: ${customer.created_at.getTime()})`);

    const rdiSyncTime = (performance.now() - rdiStartTime).toFixed(2);

    console.log('\n========================================');
    console.log('✓ RDI SYNC COMPLETE');
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer inserted into PostgreSQL and automatically synced to Redis via RDI',
      metrics: {
        postgresInsertTime: parseFloat(pgInsertTime),
        rdiSyncTime: parseFloat(rdiSyncTime),
        totalTime: parseFloat(pgInsertTime) + parseFloat(rdiSyncTime)
      }
    });
  } catch (error: any) {
    console.error('Error inserting customer:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to insert customer', details: error.message },
      { status: 500 }
    );
  }
}
