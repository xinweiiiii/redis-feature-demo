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

    // Scan for all customer keys created by RDI (format: customers:id:*:email:*)
    console.log(`[${requestId}] Scanning Redis for keys matching 'customers:id:*'`);
    const customerKeys = await redis.keys('customers:id:*');
    console.log(`[${requestId}] Redis returned ${customerKeys.length} customer keys:`, customerKeys);

    if (customerKeys.length === 0) {
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

    // Get customer data from each key
    const customers = await Promise.all(
      customerKeys.map(async (key) => {
        // Parse customer ID from key (format: customers:id:{id}:email:{email})
        const idMatch = key.match(/customers:id:(\d+):/);
        if (!idMatch) {
          console.warn(`Could not parse ID from key: ${key}`);
          return null;
        }
        const customerId = idMatch[1];

        const customerData = await redis.hGetAll(key);
        console.log(`Customer data from key ${key}:`, customerData);

        // Skip if customer data is empty
        if (!customerData || Object.keys(customerData).length === 0) {
          console.warn(`No data found for key: ${key}`);
          return null;
        }

        return {
          id: parseInt(customerData.id || customerId),
          name: customerData.name || '',
          email: customerData.email || '',
          country: customerData.country === '' ? null : customerData.country || null,
          created_at: customerData.created_at || new Date().toISOString(),
        };
      })
    );

    // Filter out any null entries and sort by ID (newest first)
    const validCustomers = customers
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.id - a.id);

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
