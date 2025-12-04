import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { leaderboard } = await request.json();

    console.log('[Leaderboard] Clearing leaderboard:', leaderboard);

    if (!leaderboard) {
      return NextResponse.json(
        { success: false, error: 'Leaderboard name is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Delete the leaderboard
    await client.del(leaderboard);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Leaderboard '${leaderboard}' cleared`,
      executionTime,
    });
  } catch (error) {
    console.error('[Leaderboard] Error clearing leaderboard:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
