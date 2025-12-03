import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { key, count = 20 } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Generate random data points over the last hour
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const interval = (now - oneHourAgo) / count;

    // Create time series if it doesn't exist
    try {
      await client.ts.create(key, {
        RETENTION: 259200000, // 3 days in milliseconds
      });
    } catch (error) {
      // Time series already exists, continue
    }

    // Generate and add data points
    for (let i = 0; i < count; i++) {
      const timestamp = Math.floor(oneHourAgo + interval * i);
      // Generate random value based on key type
      let value;
      if (key.includes('temperature')) {
        value = 20 + Math.random() * 10; // 20-30°C
      } else if (key.includes('humidity')) {
        value = 40 + Math.random() * 40; // 40-80%
      } else if (key.includes('pressure')) {
        value = 1000 + Math.random() * 50; // 1000-1050 hPa
      } else if (key.includes('cpu')) {
        value = 20 + Math.random() * 60; // 20-80%
      } else {
        value = Math.random() * 100;
      }

      await client.ts.add(key, timestamp, parseFloat(value.toFixed(2)));
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Generated ${count} random data points`,
      count,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
