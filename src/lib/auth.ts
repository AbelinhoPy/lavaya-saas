import 'server-only';
import { betterAuth } from 'better-auth';
import { getPool, isDbConfigured } from './db';

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  'lavaya-dev-insecure-secret-key-change-in-production-1234567890';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export const auth = betterAuth({
  ...(isDbConfigured() ? { database: getPool() } : {}),
  baseURL: siteUrl,
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[LavaYA! Auth] Enlace de restablecimiento generado para ${user.email}: ${url}`);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
  },
});
