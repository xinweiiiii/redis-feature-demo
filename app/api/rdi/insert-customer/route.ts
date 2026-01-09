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
    console.log(`✓ PostgreSQL write time: ${pgInsertTime}ms`);

    // STEP 2: Wait for RDI to sync via CDC (may take a moment)
    console.log('\n========================================');
    console.log('STEP 2: Waiting for RDI to sync to Redis via CDC...');
    console.log('========================================');

    const redis = await getRedisClient();
    let synced = false;
    let attempts = 0;
    let syncedKey = '';
    const maxAttempts = 10;

    // Poll Redis to check if data has been synced
    // RDI creates keys in format: customers:id:{id}:email:{email}
    while (!synced && attempts < maxAttempts) {
      attempts++;

      // Scan for key matching the pattern
      const keys = await redis.keys(`customers:id:${customer.id}:*`);

      if (keys.length > 0) {
        synced = true;
        syncedKey = keys[0];
        console.log(`✓ RDI sync detected after ${attempts} attempt(s)`);
        console.log(`✓ Key created: ${syncedKey}`);
      } else {
        console.log(`Waiting for sync... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      }
    }

    if (!synced) {
      console.log('⚠ Warning: Data not yet synced to Redis (CDC may take longer)');
    }

    // STEP 3: Read from Redis to verify sync and measure read performance
    console.log('\n========================================');
    console.log('STEP 3: Reading customer data from Redis...');
    console.log('========================================');

    const redisStartTime = performance.now();
    let redisData = {};

    if (syncedKey) {
      redisData = await redis.hGetAll(syncedKey);
    }

    const redisReadTime = (performance.now() - redisStartTime).toFixed(2);

    console.log('✓ Customer data read from Redis:', redisData);
    console.log(`✓ Redis read time: ${redisReadTime}ms`);
    console.log('========================================\n');

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer inserted into PostgreSQL and synced to Redis via RDI',
      synced: synced,
      metrics: {
        postgresWriteTime: parseFloat(pgInsertTime),
        redisReadTime: parseFloat(redisReadTime),
        syncAttempts: attempts
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
