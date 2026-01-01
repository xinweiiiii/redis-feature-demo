import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = Date.now();
  console.log(`\n========================================`);
  console.log(`[${requestId}] GET /api/rdi/get-customers - NEW REQUEST`);
  console.log(`========================================`);

  try {
    // Get Redis client
    const redis = await getRedisClient();
    console.log(`[${requestId}] Redis client obtained`);

    // Track Redis read time
    const redisStartTime = performance.now();

    // Get all customer IDs from the sorted set (newest first)
    console.log(`[${requestId}] Querying Redis: zRange('customers:timeline')`);
    const customerIds = await redis.zRange('customers:timeline', 0, -1, { REV: true });
    console.log(`[${requestId}] Redis returned ${customerIds.length} customer IDs:`, customerIds);

    if (customerIds.length === 0) {
      const redisReadTime = (performance.now() - redisStartTime).toFixed(2);
      console.log(`[${requestId}] No customers found - returning empty array`);
      console.log(`========================================\n`);
      return NextResponse.json({
        success: true,
        customers: [],
        count: 0,
        metrics: {
          redisReadTime: parseFloat(redisReadTime)
        },
        timestamp: requestId,
        cached: false
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
          country: customerData.country === '' ? null : customerData.country,
          created_at: customerData.created_at,
        };
      })
    );

    // Filter out any null entries
    const validCustomers = customers.filter((c): c is NonNullable<typeof c> => c !== null);

    const redisReadTime = (performance.now() - redisStartTime).toFixed(2);

    console.log(`[${requestId}] Returning ${validCustomers.length} customers`);
    console.log(`[${requestId}] Redis read time: ${redisReadTime}ms`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      customers: validCustomers,
      count: validCustomers.length,
      metrics: {
        redisReadTime: parseFloat(redisReadTime)
      },
      timestamp: requestId,
      cached: false
    });
  } catch (error: any) {
    console.error('Error getting customers from Redis:', error);
    return NextResponse.json(
      { error: 'Failed to get customers', details: error.message },
      { status: 500 }
    );
  }
}
