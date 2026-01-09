import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

// In-memory storage for time series data (in production, use Redis TimeSeries or external storage)
let timeSeriesData: Array<{
  timestamp: number;
  ops_per_sec: number;
  used_memory: number;
  connected_clients: number;
  hit_rate: number;
}> = [];

const MAX_DATA_POINTS = 60; // Keep last 60 data points (5 minutes at 5-second intervals)

export async function GET() {
  try {
    const client = await getRedisClient();

    // Get current metrics
    const info = await client.info();

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

    // Calculate hit rate
    const hits = parseInt(infoData.stats?.keyspace_hits || '0');
    const misses = parseInt(infoData.stats?.keyspace_misses || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    // Extract used memory in bytes
    const usedMemoryStr = infoData.memory?.used_memory || '0';
    const usedMemory = parseInt(usedMemoryStr);

    // Add new data point
    const dataPoint = {
      timestamp: Date.now(),
      ops_per_sec: parseInt(infoData.stats?.instantaneous_ops_per_sec || '0'),
      used_memory: usedMemory,
      connected_clients: parseInt(infoData.clients?.connected_clients || '0'),
      hit_rate: hitRate,
    };

    timeSeriesData.push(dataPoint);

    // Keep only the last MAX_DATA_POINTS
    if (timeSeriesData.length > MAX_DATA_POINTS) {
      timeSeriesData = timeSeriesData.slice(-MAX_DATA_POINTS);
    }

    return NextResponse.json({
      success: true,
      data: timeSeriesData,
      latest: dataPoint,
    });
  } catch (error) {
    console.error('Error fetching time series data:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
