import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { stream, group } = await request.json();

    console.log('[Stream Info] Fetching info for stream:', stream, 'group:', group);

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Stream name is required' },
        { status: 400 }
      );
    }

    const client = await getRedisClient();

    // Get total message count in stream
    const totalMessages = await client.xLen(stream);
    console.log('[Stream Info] Total messages:', totalMessages);

    let pendingInfo = null;
    let consumer1Pending = 0;
    let consumer2Pending = 0;

    // Get pending messages info if group is provided
    if (group) {
      try {
        // Get pending summary for the group
        const pending = await client.xPending(stream, group);
        console.log('[Stream Info] Pending summary:', pending);

        // Get detailed pending info for each consumer using xPendingRange
        const consumer1Info = await client.xPendingRange(stream, group, '-', '+', 100, { consumer: 'consumer1' });
        const consumer2Info = await client.xPendingRange(stream, group, '-', '+', 100, { consumer: 'consumer2' });

        consumer1Pending = Array.isArray(consumer1Info) ? consumer1Info.length : 0;
        consumer2Pending = Array.isArray(consumer2Info) ? consumer2Info.length : 0;

        console.log('[Stream Info] Consumer1 pending:', consumer1Pending);
        console.log('[Stream Info] Consumer2 pending:', consumer2Pending);

        // The pending object structure: { pending, lower, higher, consumers }
        const totalPending = typeof pending === 'object' && pending !== null
          ? (pending.pending || 0)
          : 0;

        pendingInfo = {
          total: totalPending,
          consumer1: consumer1Pending,
          consumer2: consumer2Pending,
        };

        console.log('[Stream Info] Final pending info:', pendingInfo);
      } catch (error) {
        console.error('[Stream Info] Error fetching pending info:', error);
        // Group might not exist yet
        pendingInfo = {
          total: 0,
          consumer1: 0,
          consumer2: 0,
        };
      }
    }

    return NextResponse.json({
      success: true,
      totalMessages,
      pendingInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
