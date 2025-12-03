import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { stream, message } = await request.json();

    if (!stream || !message) {
      return NextResponse.json(
        { success: false, error: 'Stream name and message are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Add message to stream using XADD
    // '*' means auto-generate ID
    const messageId = await client.xAdd(stream, '*', message);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      messageId,
      message,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
