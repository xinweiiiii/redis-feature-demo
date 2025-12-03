import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { TimeSeriesAggregationType } from '@redis/time-series';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const aggregation = searchParams.get('aggregation') || 'avg';

    if (!key || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Key, start, and end are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Map aggregation types to Redis Time Series aggregation types
    const aggregationMap: { [key: string]: TimeSeriesAggregationType } = {
      avg: TimeSeriesAggregationType.AVG,
      sum: TimeSeriesAggregationType.SUM,
      min: TimeSeriesAggregationType.MIN,
      max: TimeSeriesAggregationType.MAX,
      count: TimeSeriesAggregationType.COUNT,
    };

    const tsAggregation = aggregationMap[aggregation] || TimeSeriesAggregationType.AVG;

    // Calculate bucket size (1 second = 1000ms)
    const bucketSize = 1000;

    // Query time series with aggregation
    const results = await client.ts.range(key, parseInt(start), parseInt(end), {
      AGGREGATION: {
        type: tsAggregation,
        timeBucket: bucketSize,
      },
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        value: 0,
        count: 0,
        aggregation,
        executionTime: performance.now() - startTime,
      });
    }

    // Calculate overall aggregation from the bucketed results
    const values = results.map((item) => item.value);
    let result = 0;
    switch (aggregation) {
      case 'avg':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      case 'count':
        result = values.length;
        break;
      default:
        result = values.reduce((a, b) => a + b, 0) / values.length;
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      value: result,
      count: values.length,
      aggregation,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
