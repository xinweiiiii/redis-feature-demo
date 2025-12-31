import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Get Redis client
    const redis = await getRedisClient();

    // Track Redis read time
    const redisStartTime = performance.now();

    // Get all customer IDs from the sorted set (newest first)
    const customerIds = await redis.zRange('customers:timeline', 0, -1, { REV: true });

    if (customerIds.length === 0) {
      const redisReadTime = (performance.now() - redisStartTime).toFixed(2);
      return NextResponse.json({
        success: true,
        customers: [],
        count: 0,
        metrics: {
          redisReadTime: parseFloat(redisReadTime)
        }
      });
    }

    // Get customer data from hashes
    const customers = await Promise.all(
      customerIds.map(async (id) => {
        const customerData = await redis.hGetAll(`customer:${id}`);
        return {
          id: parseInt(customerData.id),
          name: customerData.name,
          email: customerData.email,
          country: customerData.country || null,
          created_at: customerData.created_at,
        };
      })
    );

    const redisReadTime = (performance.now() - redisStartTime).toFixed(2);

    return NextResponse.json({
      success: true,
      customers,
      count: customers.length,
      metrics: {
        redisReadTime: parseFloat(redisReadTime)
      }
    });
  } catch (error: any) {
    console.error('Error getting customers from Redis:', error);
    return NextResponse.json(
      { error: 'Failed to get customers', details: error.message },
      { status: 500 }
    );
  }
}
