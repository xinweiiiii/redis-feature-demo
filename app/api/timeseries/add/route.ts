import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, value, timestamp } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Use current timestamp if not provided
    const ts = timestamp || Date.now();

    try {
      // Try to add to existing time series
      await client.ts.add(key, ts, value, {
        RETENTION: 259200000, // 3 days in milliseconds
      });
    } catch (error) {
      // If time series doesn't exist, create it first
      await client.ts.create(key, {
        RETENTION: 259200000, // 3 days in milliseconds
      });
      await client.ts.add(key, ts, value);
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Data point added successfully',
      timestamp: ts,
      value,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
