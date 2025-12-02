import { NextRequest } from 'next/server';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channels = searchParams.get('channels')?.split(',') || [];

  if (channels.length === 0) {
    return new Response('No channels specified', { status: 400 });
  }

  // Create a new Redis client for subscription
  const subscriber = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
  });

  await subscriber.connect();

  // Set up Server-Sent Events stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Subscribe to channels
  for (const channel of channels) {
    await subscriber.subscribe(channel, (message) => {
      const data = JSON.stringify({
        channel,
        message,
        timestamp: new Date().toISOString(),
      });
      writer.write(encoder.encode(`data: ${data}\n\n`));
    });
  }

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected', channels })}\n\n`));

  // Handle client disconnect
  request.signal.addEventListener('abort', async () => {
    await subscriber.quit();
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
