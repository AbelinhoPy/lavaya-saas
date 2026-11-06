import 'server-only';
import { betterAuth } from 'better-auth';
import { getPool, isDbConfigured } from './db';
import { sendVerificationEmail, sendPasswordResetEmail } from './email';

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  'lavaya-dev-insecure-secret-key-change-in-production-1234567890';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';

export const auth = betterAuth({
  ...(isDbConfigured() ? { database: getPool() } : {}),
  baseURL: siteUrl,
  trustedOrigins: [
    'https://lavaya-orcin.vercel.app',
    'https://lavaya-toman13.vercel.app',
    'http://localhost:3100',
    'http://localhost:3000',
  ],
  secret: authSecret,
  user: {
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  account: {
    fields: {
      userId: 'user_id',
      accountId: 'account_id',
      providerId: 'provider_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      idToken: 'id_token',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  verification: {
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
  },
});
