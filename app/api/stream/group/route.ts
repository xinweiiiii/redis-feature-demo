import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { action, stream, group, consumer, count = 10 } = await request.json();

    if (!stream || !group) {
      return NextResponse.json(
        { success: false, error: 'Stream and group names are required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    if (action === 'create') {
      // Create consumer group
      try {
        await client.xGroupCreate(stream, group, '0', {
          MKSTREAM: true, // Create stream if it doesn't exist
        });

        const executionTime = performance.now() - startTime;

        return NextResponse.json({
          success: true,
          message: `Consumer group '${group}' created`,
          executionTime,
        });
      } catch (error: any) {
        if (error.message.includes('BUSYGROUP')) {
          return NextResponse.json({
            success: true,
            message: `Consumer group '${group}' already exists`,
            executionTime: performance.now() - startTime,
          });
        }
        throw error;
      }
    } else if (action === 'read') {
      // Read messages from group as a consumer
      if (!consumer) {
        return NextResponse.json(
          { success: false, error: 'Consumer name is required for reading' },
          { status: 400 }
        );
      }

      const messages = await client.xReadGroup(
        group,
        consumer,
        { key: stream, id: '>' }, // '>' means new messages
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
        consumer,
        count: formattedMessages.length,
        executionTime,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
