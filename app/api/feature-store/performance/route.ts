import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const results = {
      userId,
      comparison: {} as any
    };

    // ===== METHOD 1: Feature Store (Pre-computed) =====
    const featureStoreStart = Date.now();

    const features = await redis.hGetAll(`features:${userId}`);

    const featureStoreTime = Date.now() - featureStoreStart;

    results.comparison.featureStore = {
      method: 'Redis Feature Store (Pre-computed)',
      retrievalTimeMs: featureStoreTime,
      features: features || {},
      advantages: [
        'Sub-millisecond retrieval',
        'Consistent features across models',
        'No computation overhead',
        'Scales to millions of requests/sec'
      ]
    };

    // ===== METHOD 2: On-Demand Computation (No Cache) =====
    const onDemandStart = Date.now();

    // Simulate retrieving raw transaction data
    const transactionKey = `transactions:${userId}`;
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Simulate delays from multiple database queries
    await new Promise(resolve => setTimeout(resolve, 5)); // DB query latency
    const recentTransactions = await redis.zRangeByScore(transactionKey, oneDayAgo, now);

    await new Promise(resolve => setTimeout(resolve, 3)); // Another query
    const transactions24h = await redis.zCount(transactionKey, oneDayAgo, now);

    await new Promise(resolve => setTimeout(resolve, 3));
    const transactions1h = await redis.zCount(transactionKey, oneHourAgo, now);

    await new Promise(resolve => setTimeout(resolve, 2));
    const distinctDevicesCount = await redis.sCard(`devices:${userId}`);

    await new Promise(resolve => setTimeout(resolve, 2));
    const distinctIpCount = await redis.sCard(`ips:${userId}`);

    // Simulate complex computation
    await new Promise(resolve => setTimeout(resolve, 10)); // Feature engineering time

    const amounts = recentTransactions.map((txStr: string) => {
      try {
        return JSON.parse(txStr).amount;
      } catch {
        return 0;
      }
    });

    const avgAmount = amounts.length > 0
      ? amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length
      : 0;

    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;

    const onDemandTime = Date.now() - onDemandStart;

    results.comparison.onDemand = {
      method: 'On-Demand Computation (No Cache)',
      computationTimeMs: onDemandTime,
      databaseQueries: 5,
      disadvantages: [
        'High latency (multiple DB queries)',
        'Computation overhead',
        'Training-serving skew risk',
        'Cannot scale to high QPS'
      ]
    };

    // ===== Performance Comparison =====
    results.comparison.summary = {
      speedup: `${(onDemandTime / featureStoreTime).toFixed(1)}x faster`,
      timeSavedMs: onDemandTime - featureStoreTime,
      featureStoreLatency: `${featureStoreTime}ms`,
      onDemandLatency: `${onDemandTime}ms`,
      recommendation: 'Feature Store is optimal for real-time ML inference'
    };

    // ===== Scale Simulation =====
    const requestsPerSecond = 1000;
    const featureStoreThroughput = Math.floor(1000 / featureStoreTime);
    const onDemandThroughput = Math.floor(1000 / onDemandTime);

    results.comparison.scale = {
      targetQPS: requestsPerSecond,
      featureStore: {
        maxQPS: `${featureStoreThroughput.toLocaleString()} requests/sec`,
        canHandleLoad: featureStoreThroughput >= requestsPerSecond,
        parallelQueries: Math.ceil(requestsPerSecond / featureStoreThroughput)
      },
      onDemand: {
        maxQPS: `${onDemandThroughput.toLocaleString()} requests/sec`,
        canHandleLoad: onDemandThroughput >= requestsPerSecond,
        parallelQueries: Math.ceil(requestsPerSecond / onDemandThroughput)
      }
    };

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Error in performance comparison:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run performance comparison'
    }, { status: 500 });
  }
}
