import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard, player, score } = await request.json();

    console.log('[Leaderboard] Adding score:', { leaderboard, player, score });

    if (!leaderboard || !player || score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name, player, and score are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Add or update player score in sorted set
    await client.zAdd(leaderboard, { score, value: player });

    // Get updated rank (0-based, so add 1 for display)
    const rank = await client.zRevRank(leaderboard, player);
    const displayRank = rank !== null ? rank + 1 : null;

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      player,
      score,
      rank: displayRank,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error adding score:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
