import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const redis = await getRedisClient();
    // Get total users
    const totalUsers = await redis.sCard('feature_store:users');

    // Get total transactions
    const totalTransactions = await redis.get('feature_store:total_transactions');

    // Get all users and calculate average fraud score
    const userIds = await redis.sMembers('feature_store:users');

    let totalFraudScore = 0;
    let highRiskUsers = 0;
    let validScores = 0;

    if (userIds && userIds.length > 0) {
      const results = await Promise.all(
        userIds.map(async (userId: string) => {
          try {
            const score = await redis.hGet(`features:${userId}`, 'fraudScore');
            return [null, score];
          } catch (error) {
            return [error, null];
          }
        })
      );

      if (results) {
        results.forEach((result: any) => {
          const [error, score] = result;

          if (!error && score) {
            const fraudScore = parseFloat(score);
            totalFraudScore += fraudScore;
            validScores++;

            if (fraudScore > 0.7) {
              highRiskUsers++;
            }
          }
        });
      }
    }

    const avgFraudScore = validScores > 0 ? totalFraudScore / validScores : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalTransactions: parseInt(totalTransactions || '0'),
        avgFraudScore,
        highRiskUsers
      }
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get statistics'
    }, { status: 500 });
  }
}
