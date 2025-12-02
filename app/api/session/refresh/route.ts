import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    const sessionKey = `session:${sessionId}`;

    // Check if session exists
    const sessionData = await client.hGetAll(sessionKey);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Session expiration (30 minutes)
    const sessionTTL = 30 * 60; // 30 minutes in seconds
    const newExpiresAt = new Date(Date.now() + sessionTTL * 1000).toISOString();

    // Update expiration time in session data
    await client.hSet(sessionKey, 'expiresAt', newExpiresAt);

    // Extend TTL on the session key
    await client.expire(sessionKey, sessionTTL);

    // Also extend TTL on the user sessions set
    const userSessionsKey = `user_sessions:${sessionData.email}`;
    await client.expire(userSessionsKey, sessionTTL);

    // Get updated session data
    const updatedSessionData = await client.hGetAll(sessionKey);
    const ttl = await client.ttl(sessionKey);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      session: updatedSessionData,
      ttl,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
