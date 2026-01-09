import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

// Store previous metrics to calculate deltas
let previousMetrics = {
  keyspace_hits: 0,
  keyspace_misses: 0,
  total_commands_processed: 0,
  timestamp: Date.now(),
};

export async function GET() {
  try {
    const client = await getRedisClient();

    // Get Redis INFO command output
    const info = await client.info();

    // Parse INFO output
    const parseInfo = (infoStr: string) => {
      const sections: any = {};
      let currentSection = '';

      infoStr.split('\r\n').forEach(line => {
        if (line.startsWith('#')) {
          currentSection = line.substring(2).toLowerCase();
          sections[currentSection] = {};
        } else if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (currentSection) {
            sections[currentSection][key] = value;
          }
        }
      });

      return sections;
    };

    const infoData = parseInfo(info);

    // Get keyspace info
    const dbKeys = await client.dbSize();

    // Calculate hit rate
    const hits = parseInt(infoData.stats?.keyspace_hits || '0');
    const misses = parseInt(infoData.stats?.keyspace_misses || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    // Calculate deltas since last refresh (to filter out monitoring overhead)
    const currentTimestamp = Date.now();
    const timeDelta = (currentTimestamp - previousMetrics.timestamp) / 1000; // in seconds

    const hitsDelta = Math.max(0, hits - previousMetrics.keyspace_hits);
    const missesDelta = Math.max(0, misses - previousMetrics.keyspace_misses);
    const totalDelta = hitsDelta + missesDelta;
    const hitRateDelta = totalDelta > 0 ? (hitsDelta / totalDelta) * 100 : hitRate;

    // Calculate operations per second based on delta
    const commandsProcessed = parseInt(infoData.stats?.total_commands_processed || '0');
    const commandsDelta = Math.max(0, commandsProcessed - previousMetrics.total_commands_processed);
    const actualOpsPerSec = timeDelta > 0 ? Math.round(commandsDelta / timeDelta) : 0;

    // Update previous metrics for next calculation
    previousMetrics = {
      keyspace_hits: hits,
      keyspace_misses: misses,
      total_commands_processed: commandsProcessed,
      timestamp: currentTimestamp,
    };

    // Get keyspace info from INFO
    let totalKeys = dbKeys;
    let expires = 0;
    let avgTtl = 0;

    // Parse keyspace section for more details
    if (infoData.keyspace) {
      Object.keys(infoData.keyspace).forEach(db => {
        const match = infoData.keyspace[db].match(/keys=(\d+),expires=(\d+),avg_ttl=(\d+)/);
        if (match) {
          expires += parseInt(match[2]);
          avgTtl = parseInt(match[3]);
        }
      });
    }

    const metrics = {
      server: {
        redis_version: infoData.server?.redis_version || 'Unknown',
        uptime_in_seconds: parseInt(infoData.server?.uptime_in_seconds || '0'),
        uptime_in_days: parseInt(infoData.server?.uptime_in_days || '0'),
        connected_clients: parseInt(infoData.clients?.connected_clients || '0'),
      },
      memory: {
        used_memory_human: infoData.memory?.used_memory_human || '0B',
        used_memory_peak_human: infoData.memory?.used_memory_peak_human || '0B',
        maxmemory_human: infoData.memory?.maxmemory_human || '0B',
        mem_fragmentation_ratio: infoData.memory?.mem_fragmentation_ratio || '1.0',
      },
      stats: {
        total_connections_received: parseInt(infoData.stats?.total_connections_received || '0'),
        total_commands_processed: parseInt(infoData.stats?.total_commands_processed || '0'),
        instantaneous_ops_per_sec: parseInt(infoData.stats?.instantaneous_ops_per_sec || '0'),
        keyspace_hits: hits,
        keyspace_misses: misses,
        hit_rate: hitRate,
        // Delta values (filters out monitoring overhead)
        keyspace_hits_delta: hitsDelta,
        keyspace_misses_delta: missesDelta,
        hit_rate_delta: hitRateDelta,
        actual_ops_per_sec: actualOpsPerSec,
      },
      keyspace: {
        total_keys: totalKeys,
        expires: expires,
        avg_ttl: avgTtl,
      },
      replication: {
        role: infoData.replication?.role || 'master',
        connected_slaves: parseInt(infoData.replication?.connected_slaves || '0'),
      },
    };

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching Redis metrics:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
