import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { stream, count = 10, lastId = '0' } = await request.json();

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Stream name is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Read messages from stream using XREAD
    // Start from lastId, or '0' for all messages
    const messages = await client.xRead(
      { key: stream, id: lastId },
      { COUNT: count }
    );

    const executionTime = performance.now() - startTime;

    // Format the messages
    const formattedMessages = messages ? messages[0]?.messages.map((msg: any) => ({
      id: msg.id,
      message: msg.message,
    })) : [];

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
      executionTime,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
