import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    return NextResponse.json({
      isAuthenticated: session.isAuthenticated || false,
    });
  } catch (error) {
    console.error('[Auth] Check error:', error);
    return NextResponse.json({
      isAuthenticated: false,
    });
  }
}
