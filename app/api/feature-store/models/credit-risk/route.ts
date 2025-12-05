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

    // Simulate ML model inference (Credit Risk Model)
    const inferenceStart = Date.now();

    // Parse features
    const transactionCount24h = parseInt(features.transactionCount24h) || 0;
    const avgAmount = parseFloat(features.avgTransactionAmount) || 0;
    const accountAgeDays = parseInt(features.accountAgeDays) || 0;
    const failedLoginAttempts = parseInt(features.failedLoginAttempts) || 0;

    // Mock credit risk score (0-100, higher is better)
    let creditScore = 500; // Base score

    // Positive factors
    creditScore += Math.min(accountAgeDays, 365) * 0.5; // Older accounts = better
    creditScore += transactionCount24h * 2; // More activity = established user
    creditScore += Math.min(avgAmount, 500) * 0.3; // Reasonable spending

    // Negative factors
    creditScore -= failedLoginAttempts * 20; // Security issues
    creditScore -= Math.max(0, transactionCount24h - 10) * 5; // Too much activity

    // Clamp to 300-850 range (typical credit score range)
    creditScore = Math.max(300, Math.min(850, creditScore));

    const inferenceTime = Date.now() - inferenceStart;
    const totalTime = Date.now() - startTime;

    // Determine risk tier
    let riskTier = 'EXCELLENT';
    if (creditScore < 580) riskTier = 'POOR';
    else if (creditScore < 670) riskTier = 'FAIR';
    else if (creditScore < 740) riskTier = 'GOOD';
    else if (creditScore < 800) riskTier = 'VERY GOOD';

    return NextResponse.json({
      success: true,
      model: 'credit-risk-v3.0',
      modelType: 'Neural Network',
      prediction: {
        creditScore: Math.round(creditScore),
        riskTier,
        approvedForCredit: creditScore >= 650,
        maxCreditLimit: creditScore >= 650 ? Math.round((creditScore - 300) * 10) : 0
      },
      featuresUsed: [
        'transactionCount24h',
        'avgTransactionAmount',
        'accountAgeDays',
        'failedLoginAttempts'
      ],
      performance: {
        featureRetrievalMs: featureRetrievalTime,
        inferenceMs: inferenceTime,
        totalMs: totalTime
      }
    });

  } catch (error) {
    console.error('Error in credit risk model:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run credit risk model'
    }, { status: 500 });
  }
}
