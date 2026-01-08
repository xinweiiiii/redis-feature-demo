import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET(_request: NextRequest) {
  try {
    const client = await getRedisClient();

    // Check if the search index exists and has documents
    try {
      const indexInfo = await client.ft.info('idx:products');
      const numDocs = indexInfo.numDocs;

      return NextResponse.json({
        initialized: numDocs > 0,
        documentCount: numDocs,
      });
    } catch (error: any) {
      // Index doesn't exist
      return NextResponse.json({
        initialized: false,
        documentCount: 0,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { initialized: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
