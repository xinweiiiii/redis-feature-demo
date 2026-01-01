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
        console.log(`Customer ${id} data from Redis:`, customerData);

        // Skip if customer data is empty (shouldn't happen, but safety check)
        if (!customerData || Object.keys(customerData).length === 0) {
          console.warn(`No data found for customer:${id}`);
          return null;
        }

        return {
          id: parseInt(customerData.id),
          name: customerData.name,
          email: customerData.email,
          country: customerData.country || null,
          created_at: customerData.created_at,
        };
      })
    );

    // Filter out any null entries
    const validCustomers = customers.filter((c) => c !== null);

    const redisReadTime = (performance.now() - redisStartTime).toFixed(2);

    console.log(`Returning ${validCustomers.length} customers`);

    return NextResponse.json({
      success: true,
      customers: validCustomers,
      count: validCustomers.length,
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
