import { SessionOptions } from 'iron-session';

export interface SessionData {
  isAuthenticated: boolean;
  loginTime?: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security',
  cookieName: 'redis-demo-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export const defaultSession: SessionData = {
  isAuthenticated: false,
};
