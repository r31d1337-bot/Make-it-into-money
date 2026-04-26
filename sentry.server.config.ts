import * as Sentry from "@sentry/nextjs";

/**
 * Node-side Sentry (API routes, RSC, server components). Same DSN as client.
 * No-op without NEXT_PUBLIC_SENTRY_DSN, so dev runs clean.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
