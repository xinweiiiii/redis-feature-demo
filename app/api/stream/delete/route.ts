import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { stream, deleteStream = false, clearPending = false, group } = await request.json();

    console.log('[Stream Delete] Action:', { stream, deleteStream, clearPending, group });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Stream name is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();
    const startTime = performance.now();

    if (clearPending && group) {
      // Clear pending list by acknowledging all pending messages
      console.log('[Stream Delete] Clearing pending list for group:', group);

      try {
        // Get all pending messages for the group
        const pending = await client.xPendingRange(stream, group, '-', '+', 10000);

        if (Array.isArray(pending) && pending.length > 0) {
          // Extract message IDs and acknowledge them all
          const messageIds = pending.map((p: any) => p.id);
          const acknowledged = await client.xAck(stream, group, messageIds);

          console.log('[Stream Delete] Acknowledged', acknowledged, 'pending messages');

          const executionTime = performance.now() - startTime;

          return NextResponse.json({
            success: true,
            message: `Cleared ${acknowledged} pending messages from group '${group}'`,
            acknowledged,
            executionTime,
          });
        } else {
          return NextResponse.json({
            success: true,
            message: 'No pending messages to clear',
            acknowledged: 0,
            executionTime: performance.now() - startTime,
          });
        }
      } catch (error) {
        console.error('[Stream Delete] Error clearing pending:', error);
        throw error;
      }
    } else if (deleteStream) {
      // Delete the entire stream and consumer groups
      await client.del(stream);
      console.log('[Stream Delete] Deleted entire stream:', stream);

      const executionTime = performance.now() - startTime;

      return NextResponse.json({
        success: true,
        message: `Stream '${stream}' deleted completely`,
        executionTime,
      });
    } else {
      // Trim all messages from the stream (keeps the stream structure)
      await client.xTrim(stream, 'MAXLEN', 0);
      console.log('[Stream Delete] Trimmed all messages from stream:', stream);

      const executionTime = performance.now() - startTime;

      return NextResponse.json({
        success: true,
        message: `All messages deleted from stream '${stream}'`,
        executionTime,
      });
    }
  } catch (error) {
    console.error('[Stream Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
