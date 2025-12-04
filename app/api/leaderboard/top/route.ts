import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard, count = 10 } = await request.json();

    console.log('[Leaderboard] Getting top players:', { leaderboard, count });

    if (!leaderboard) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Get top N players with scores (highest to lowest)
    const topPlayers = await client.zRangeWithScores(leaderboard, 0, count - 1, {
      REV: true, // Reverse order (highest first)
    });

    // Format the results
    const results = topPlayers.map((player, index) => ({
      rank: index + 1,
      player: player.value,
      score: player.score,
    }));

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      leaderboard: results,
      count: results.length,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error getting top players:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
