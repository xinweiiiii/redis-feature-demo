import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard, player, range = 2 } = await request.json();

    console.log('[Leaderboard] Getting players around:', { leaderboard, player, range });

    if (!leaderboard || !player) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name and player are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Get player rank
    const playerRank = await client.zRevRank(leaderboard, player);

    if (playerRank === null) {
      return NextResponse.json({
        success: false,
        error: `Player '${player}' not found in leaderboard`,
      });
    }

    // Get players around the target player
    const start = Math.max(0, playerRank - range);
    const end = playerRank + range;

    const playersAround = await client.zRangeWithScores(leaderboard, start, end, {
      REV: true,
    });

    // Format results
    const results = playersAround.map((p, index) => ({
      rank: start + index + 1,
      player: p.value,
      score: p.score,
      isTarget: p.value === player,
    }));

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      players: results,
      targetRank: playerRank + 1,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error getting players around:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
