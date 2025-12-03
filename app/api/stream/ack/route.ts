import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { stream, group, messageIds } = await request.json();

    if (!stream || !group || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { success: false, error: 'Stream, group, and messageIds array are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Acknowledge messages using XACK
    const acknowledged = await client.xAck(stream, group, messageIds);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      acknowledged,
      messageIds,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
