import * as Sentry from "@sentry/nextjs";

/**
 * Next.js App Router instrumentation hook. Loads the right Sentry config
 * based on which runtime the request is being served from. The configs
 * themselves are no-ops if NEXT_PUBLIC_SENTRY_DSN isn't set, so this is
 * always safe to import.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Surface server-component / RSC render errors to Sentry. No-op without DSN.
export const onRequestError = Sentry.captureRequestError;
