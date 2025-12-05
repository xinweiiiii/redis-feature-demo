import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const redis = await getRedisClient();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Retrieve features from feature store (same features, different model)
    const featureRetrievalStart = Date.now();
    const features = await redis.hGetAll(`features:${userId}`);
    const featureRetrievalTime = Date.now() - featureRetrievalStart;

    if (!features || Object.keys(features).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No features found for this user. Please compute features first.'
      }, { status: 404 });
    }

    // Simulate ML model inference (Personalization/Recommendation Model)
    const inferenceStart = Date.now();

    // Parse features
    const transactionCount24h = parseInt(features.transactionCount24h) || 0;
    const avgAmount = parseFloat(features.avgTransactionAmount) || 0;
    const accountAgeDays = parseInt(features.accountAgeDays) || 0;

    // Mock user segment classification
    let segment = 'NEW_USER';
    let lifetimeValue = 0;
    let recommendations = [];

    // Segment users based on behavior
    if (accountAgeDays > 180 && transactionCount24h > 5) {
      segment = 'POWER_USER';
      lifetimeValue = avgAmount * transactionCount24h * 30;
      recommendations = [
        { product: 'Premium Subscription', probability: 0.85 },
        { product: 'Exclusive Deals', probability: 0.78 },
        { product: 'VIP Program', probability: 0.72 }
      ];
    } else if (accountAgeDays > 90 && avgAmount > 100) {
      segment = 'HIGH_VALUE';
      lifetimeValue = avgAmount * transactionCount24h * 20;
      recommendations = [
        { product: 'Premium Products', probability: 0.65 },
        { product: 'Luxury Items', probability: 0.58 },
        { product: 'Personalized Offers', probability: 0.70 }
      ];
    } else if (accountAgeDays > 30) {
      segment = 'REGULAR_USER';
      lifetimeValue = avgAmount * transactionCount24h * 15;
      recommendations = [
        { product: 'Popular Items', probability: 0.55 },
        { product: 'Trending Products', probability: 0.60 },
        { product: 'Daily Deals', probability: 0.52 }
      ];
    } else {
      segment = 'NEW_USER';
      lifetimeValue = avgAmount * 5;
      recommendations = [
        { product: 'Welcome Bundle', probability: 0.80 },
        { product: 'First Purchase Discount', probability: 0.90 },
        { product: 'Starter Pack', probability: 0.75 }
      ];
    }

    const inferenceTime = Date.now() - inferenceStart;
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      model: 'personalization-v1.5',
      modelType: 'Deep Learning Recommender',
      prediction: {
        userSegment: segment,
        predictedLifetimeValue: Math.round(lifetimeValue),
        topRecommendations: recommendations,
        engagementScore: Math.min(100, (transactionCount24h * 10) + (accountAgeDays / 3))
      },
      featuresUsed: [
        'transactionCount24h',
        'avgTransactionAmount',
        'accountAgeDays'
      ],
      performance: {
        featureRetrievalMs: featureRetrievalTime,
        inferenceMs: inferenceTime,
        totalMs: totalTime
      }
    });

  } catch (error) {
    console.error('Error in personalization model:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run personalization model'
    }, { status: 500 });
  }
}
