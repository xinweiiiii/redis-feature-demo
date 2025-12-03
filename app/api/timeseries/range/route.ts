import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!key || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Key, start, and end are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Query time series by timestamp range
    const results = await client.ts.range(key, parseInt(start), parseInt(end));

    // Parse the results - TS.RANGE returns [{timestamp, value}, ...]
    const dataPoints = results.map((item) => ({
      timestamp: item.timestamp,
      value: item.value,
    }));

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      dataPoints,
      count: dataPoints.length,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
