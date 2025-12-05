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

    const featureKey = `features:${userId}`;

    // Retrieve all features for the user
    const features = await redis.hGetAll(featureKey);

    if (!features || Object.keys(features).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No features found for this user'
      }, { status: 404 });
    }

    // Convert string values to appropriate types
    const parsedFeatures = {
      userId: features.userId || userId,
      transactionCount24h: parseInt(features.transactionCount24h) || 0,
      transactionCount1h: parseInt(features.transactionCount1h) || 0,
      avgTransactionAmount: parseFloat(features.avgTransactionAmount) || 0,
      maxTransactionAmount: parseFloat(features.maxTransactionAmount) || 0,
      accountAgeDays: parseInt(features.accountAgeDays) || 0,
      failedLoginAttempts: parseInt(features.failedLoginAttempts) || 0,
      distinctDevicesCount: parseInt(features.distinctDevicesCount) || 0,
      distinctIpCount: parseInt(features.distinctIpCount) || 0,
      lastTransactionTimestamp: parseInt(features.lastTransactionTimestamp) || 0,
      fraudScore: parseFloat(features.fraudScore) || 0,
      updatedAt: parseInt(features.updatedAt) || 0
    };

    return NextResponse.json({
      success: true,
      features: parsedFeatures
    });

  } catch (error) {
    console.error('Error retrieving features:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve features'
    }, { status: 500 });
  }
}
