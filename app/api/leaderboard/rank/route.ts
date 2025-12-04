import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard, player } = await request.json();

    console.log('[Leaderboard] Getting player rank:', { leaderboard, player });

    if (!leaderboard || !player) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name and player are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Get player rank (0-based index)
    const rank = await client.zRevRank(leaderboard, player);

    // Get player score
    const score = await client.zScore(leaderboard, player);

    // Get total number of players
    const totalPlayers = await client.zCard(leaderboard);

    const executionTime = performance.now() - startTime;

    if (rank === null || score === null) {
      return NextResponse.json({
        success: false,
        error: `Player '${player}' not found in leaderboard`,
      });
    }

    return NextResponse.json({
      success: true,
      player,
      rank: rank + 1, // Convert to 1-based
      score,
      totalPlayers,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error getting player rank:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
