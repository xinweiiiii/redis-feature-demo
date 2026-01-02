import { SessionOptions } from 'iron-session';

export interface SessionData {
  isAuthenticated: boolean;
  loginTime?: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'redis-demo-session',
  cookieOptions: {
    // Only use secure cookies when explicitly using HTTPS
    // Set to true when you have SSL/HTTPS configured on ALB
    secure: process.env.USE_SECURE_COOKIES === 'true',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax', // Allow cookies to be sent on redirects
  },
};

export const defaultSession: SessionData = {
  isAuthenticated: false,
};
