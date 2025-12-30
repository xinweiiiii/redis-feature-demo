import { NextResponse } from 'next/server';

// Simple health check endpoint for App Runner
export async function GET() {
  return NextResponse.json({ status: 'healthy' }, { status: 200 });
}
