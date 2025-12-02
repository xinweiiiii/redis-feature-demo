import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { randomBytes } from 'crypto';

interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  provider: string;
  loginTime: string;
  expiresAt: string;
  ipAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const { provider, email, name } = await request.json();

    if (!provider || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Provider, email, and name are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Generate session ID
    const sessionId = randomBytes(32).toString('hex');
    const userId = `user_${randomBytes(8).toString('hex')}`;

    // Session expiration (30 minutes)
    const sessionTTL = 30 * 60; // 30 minutes in seconds
    const expiresAt = new Date(Date.now() + sessionTTL * 1000).toISOString();

    // Get client IP (mock for demo)
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Session data
    const sessionData: SessionData = {
      sessionId,
      userId,
      email,
      name,
      provider,
      loginTime: new Date().toISOString(),
      expiresAt,
      ipAddress,
    };

    // Store session in Redis with TTL
    const sessionKey = `session:${sessionId}`;
    const userSessionsKey = `user_sessions:${email}`;

    // Store session data as hash
    await client.hSet(sessionKey, sessionData as any);
    await client.expire(sessionKey, sessionTTL);

    // Add to user's active sessions list
    await client.sAdd(userSessionsKey, sessionId);
    await client.expire(userSessionsKey, sessionTTL);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      session: sessionData,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
