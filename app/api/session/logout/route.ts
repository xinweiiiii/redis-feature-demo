import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    const sessionKey = `session:${sessionId}`;

    // Delete session
    await client.del(sessionKey);

    // Remove from user's sessions if email provided
    if (email) {
      const userSessionsKey = `user_sessions:${email}`;
      await client.sRem(userSessionsKey, sessionId);
    }

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully',
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
