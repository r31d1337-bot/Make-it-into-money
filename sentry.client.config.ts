import * as Sentry from "@sentry/nextjs";

/**
 * Browser-side Sentry. Only initialises if NEXT_PUBLIC_SENTRY_DSN is set —
 * keeps dev clean when you don't want to spam your error stream from
 * localhost. The same DSN is used for client + server; no separate one.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Conservative sampling — adjust if traffic warrants it.
    tracesSampleRate: 0.1,
    // Session replay only on errors so we can see what the user was doing
    // when something broke. Skip routine sessions to control cost.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
  });
}
