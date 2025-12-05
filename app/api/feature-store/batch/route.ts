import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User IDs array is required'
      }, { status: 400 });
    }

    // Fetch all features in parallel using Promise.all
    const results = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const data = await redis.hGetAll(`features:${userId}`);
          return [null, data];
        } catch (error) {
          return [error, null];
        }
      })
    );

    if (!results) {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve batch features'
      }, { status: 500 });
    }

    // Parse results
    const features = results
      .map((result: any, index: number) => {
        const [error, data] = result;

        if (error || !data || Object.keys(data).length === 0) {
          return null;
        }

        return {
          userId: data.userId || userIds[index],
          transactionCount24h: parseInt(data.transactionCount24h) || 0,
          transactionCount1h: parseInt(data.transactionCount1h) || 0,
          avgTransactionAmount: parseFloat(data.avgTransactionAmount) || 0,
          maxTransactionAmount: parseFloat(data.maxTransactionAmount) || 0,
          accountAgeDays: parseInt(data.accountAgeDays) || 0,
          failedLoginAttempts: parseInt(data.failedLoginAttempts) || 0,
          distinctDevicesCount: parseInt(data.distinctDevicesCount) || 0,
          distinctIpCount: parseInt(data.distinctIpCount) || 0,
          lastTransactionTimestamp: parseInt(data.lastTransactionTimestamp) || 0,
          fraudScore: parseFloat(data.fraudScore) || 0,
          updatedAt: parseInt(data.updatedAt) || 0
        };
      })
      .filter((f: any) => f !== null);

    return NextResponse.json({
      success: true,
      features,
      requestedCount: userIds.length,
      foundCount: features.length
    });

  } catch (error) {
    console.error('Error retrieving batch features:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve batch features'
    }, { status: 500 });
  }
}
