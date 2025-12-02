import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    const sessionKey = `session:${sessionId}`;

    // Get session data
    const sessionData = await client.hGetAll(sessionKey);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    // Get TTL
    const ttl = await client.ttl(sessionKey);
    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      session: sessionData,
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
