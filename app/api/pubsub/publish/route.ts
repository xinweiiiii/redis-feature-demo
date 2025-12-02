import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { channel, message } = await request.json();

    if (!channel || !message) {
      return NextResponse.json(
        { success: false, error: 'Channel and message are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    // Publish message to channel
    const subscriberCount = await client.publish(channel, message);

    const executionTime = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Published to ${subscriberCount} subscriber(s)`,
      subscriberCount,
      executionTime,
      channel,
      publishedMessage: message,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
