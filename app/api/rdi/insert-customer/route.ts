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

    // Track PostgreSQL insert time
    const pgStartTime = performance.now();
    const customer = await customerHelpers.insertCustomer(name, email, country || null);
    const pgInsertTime = (performance.now() - pgStartTime).toFixed(2);
    console.log('Customer inserted into PostgreSQL:', customer);

    // Get Redis client
    const redis = await getRedisClient();

    // Track Redis sync time
    const redisStartTime = performance.now();

    // Simulate RDI sync to Redis - store customer as a hash
    const redisKey = `customer:${customer.id}`;
    const redisData = {
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      country: customer.country || '',
      created_at: customer.created_at.toISOString(),
    };
    console.log('Syncing to Redis:', redisKey, redisData);
    await redis.hSet(redisKey, redisData);

    // Also add to a sorted set for easy retrieval by creation time
    await redis.zAdd('customers:timeline', {
      score: customer.created_at.getTime(),
      value: customer.id.toString(),
    });
    console.log('Added to timeline with score:', customer.created_at.getTime());

    const redisSyncTime = (performance.now() - redisStartTime).toFixed(2);
    console.log('Redis sync complete');

    return NextResponse.json({
      success: true,
      customer,
      message: 'Customer inserted into PostgreSQL and synced to Redis',
      metrics: {
        postgresInsertTime: parseFloat(pgInsertTime),
        redisSyncTime: parseFloat(redisSyncTime),
        totalTime: parseFloat(pgInsertTime) + parseFloat(redisSyncTime)
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
