import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    const userSessionsKey = `user_sessions:${email}`;

    // Get all session IDs for user
    const sessionIds = await client.sMembers(userSessionsKey);

    if (sessionIds.length === 0) {
      return NextResponse.json({
        success: true,
        sessions: [],
        executionTime: performance.now() - startTime,
      });
    }

    // Get data for each session
    const sessions = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const sessionKey = `session:${sessionId}`;
        const data = await client.hGetAll(sessionKey);
        const ttl = await client.ttl(sessionKey);

        // If session expired, remove from set
        if (ttl === -2 || Object.keys(data).length === 0) {
          await client.sRem(userSessionsKey, sessionId);
          return null;
        }

        return {
          ...data,
          ttl,
        };
      })
    );

    // Filter out null entries
    const activeSessions = sessions.filter((s) => s !== null);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      sessions: activeSessions,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
