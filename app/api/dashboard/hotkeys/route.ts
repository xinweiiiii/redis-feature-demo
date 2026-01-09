import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const client = await getRedisClient();

    // Get a sample of keys and their types
    const keys = await client.keys('*');
    const hotKeys: Array<{
      key: string;
      type: string;
      size: number;
      ttl: number;
      memory: number;
    }> = [];

    // Analyze up to 100 keys for performance
    const keysToAnalyze = keys.slice(0, 100);

    for (const key of keysToAnalyze) {
      try {
        const type = await client.type(key);
        const ttl = await client.ttl(key);

        // Get size based on type
        let size = 0;
        switch (type) {
          case 'string':
            const strValue = await client.get(key);
            size = strValue ? strValue.length : 0;
            break;
          case 'list':
            size = await client.lLen(key);
            break;
          case 'set':
            size = await client.sCard(key);
            break;
          case 'zset':
            size = await client.zCard(key);
            break;
          case 'hash':
            size = await client.hLen(key);
            break;
          case 'stream':
            size = await client.xLen(key);
            break;
        }

        // Try to get memory usage (may not be available on all Redis versions)
        let memory = 0;
        try {
          const memoryUsage = await client.memoryUsage(key);
          memory = memoryUsage || 0;
        } catch (e) {
          // Memory usage command not available
        }

        hotKeys.push({
          key,
          type,
          size,
          ttl,
          memory,
        });
      } catch (err) {
        console.error(`Error analyzing key ${key}:`, err);
      }
    }

    // Sort by memory usage (or size if memory not available)
    hotKeys.sort((a, b) => {
      if (a.memory && b.memory) return b.memory - a.memory;
      return b.size - a.size;
    });

    // Get top 20 hot keys
    const topHotKeys = hotKeys.slice(0, 20);

    // Get key pattern distribution
    const patterns: Record<string, number> = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0] || 'other';
      patterns[prefix] = (patterns[prefix] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      hotKeys: topHotKeys,
      patterns,
      totalKeys: keys.length,
      analyzedKeys: keysToAnalyze.length,
    });
  } catch (error) {
    console.error('Error fetching hot keys:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
