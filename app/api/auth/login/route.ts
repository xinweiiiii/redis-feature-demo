import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get the hashed password from environment variable
    let hashedPassword = process.env.ADMIN_PASSWORD_HASH;
    if (!hashedPassword) {
      console.error('[Auth] ADMIN_PASSWORD_HASH not set in environment variables');
      return NextResponse.json(
        { success: false, error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Strip surrounding quotes if present (from .env file)
    hashedPassword = hashedPassword.replace(/^['"]|['"]$/g, '');

    // Remove escape backslashes if present (from \$ escaping)
    hashedPassword = hashedPassword.replace(/\\/g, '');

    // Compare the provided password with the hashed password
    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.isAuthenticated = true;
    session.loginTime = Date.now();
    await session.save();

    console.log('[Auth] Login successful');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
