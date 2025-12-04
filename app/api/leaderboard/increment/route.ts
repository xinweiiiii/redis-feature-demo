import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard, player, increment } = await request.json();

    console.log('[Leaderboard] Incrementing score:', { leaderboard, player, increment });

    if (!leaderboard || !player || increment === undefined) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name, player, and increment are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Increment player score
    const newScore = await client.zIncrBy(leaderboard, increment, player);

    // Get updated rank
    const rank = await client.zRevRank(leaderboard, player);
    const displayRank = rank !== null ? rank + 1 : null;

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      player,
      newScore,
      increment,
      rank: displayRank,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error incrementing score:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
