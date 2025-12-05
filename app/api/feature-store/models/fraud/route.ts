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

    // Retrieve features from feature store
    const featureRetrievalStart = Date.now();
    const features = await redis.hGetAll(`features:${userId}`);
    const featureRetrievalTime = Date.now() - featureRetrievalStart;

    if (!features || Object.keys(features).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No features found for this user. Please compute features first.'
      }, { status: 404 });
    }

    // Simulate ML model inference (XGBoost-style fraud detection)
    const inferenceStart = Date.now();

    // Parse features
    const transactionCount1h = parseInt(features.transactionCount1h) || 0;
    const transactionCount24h = parseInt(features.transactionCount24h) || 0;
    const avgAmount = parseFloat(features.avgTransactionAmount) || 0;
    const maxAmount = parseFloat(features.maxTransactionAmount) || 0;
    const accountAgeDays = parseInt(features.accountAgeDays) || 0;
    const failedLoginAttempts = parseInt(features.failedLoginAttempts) || 0;
    const distinctDevicesCount = parseInt(features.distinctDevicesCount) || 0;
    const distinctIpCount = parseInt(features.distinctIpCount) || 0;

    // Mock ML model prediction using weighted features
    // Simulates a trained XGBoost/RandomForest model
    let fraudProbability = 0;

    // Feature importance from "trained model"
    fraudProbability += transactionCount1h * 0.18;  // High importance
    fraudProbability += (transactionCount24h / 24) * 0.12;
    fraudProbability += (maxAmount / (avgAmount + 1)) * 0.15;
    fraudProbability += (30 - Math.min(accountAgeDays, 30)) / 30 * 0.20;
    fraudProbability += failedLoginAttempts * 0.15;
    fraudProbability += distinctDevicesCount * 0.10;
    fraudProbability += distinctIpCount * 0.10;

    // Add non-linear interactions (simulating ML model complexity)
    if (transactionCount1h > 3 && accountAgeDays < 30) {
      fraudProbability += 0.15; // Interaction term
    }

    if (distinctDevicesCount > 2 && failedLoginAttempts > 0) {
      fraudProbability += 0.10; // Another interaction
    }

    // Normalize to 0-1 range with sigmoid-like function
    fraudProbability = Math.min(1.0, fraudProbability / 1.5);

    const inferenceTime = Date.now() - inferenceStart;
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      model: 'fraud-detection-v2.1',
      modelType: 'XGBoost Classifier',
      prediction: {
        fraudProbability,
        riskLevel: fraudProbability > 0.7 ? 'HIGH' : fraudProbability > 0.4 ? 'MEDIUM' : 'LOW',
        shouldBlock: fraudProbability > 0.7,
        requiresReview: fraudProbability > 0.4 && fraudProbability <= 0.7
      },
      featuresUsed: [
        'transactionCount1h',
        'transactionCount24h',
        'avgTransactionAmount',
        'maxTransactionAmount',
        'accountAgeDays',
        'failedLoginAttempts',
        'distinctDevicesCount',
        'distinctIpCount'
      ],
      performance: {
        featureRetrievalMs: featureRetrievalTime,
        inferenceMs: inferenceTime,
        totalMs: totalTime
      }
    });

  } catch (error) {
    console.error('Error in fraud model:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run fraud detection model'
    }, { status: 500 });
  }
}
