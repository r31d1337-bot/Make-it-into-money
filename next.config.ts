import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Hide the animated Next.js N-mark in the bottom-left during dev.
  devIndicators: false,
};

// Wrap with Sentry only when Sentry env is set. Without it, withSentryConfig
// is a no-op pass-through so dev stays clean.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // Tunnel browser → server through our own domain so ad-blockers don't
      // eat error reports. Works on the live droplet behind nginx.
      tunnelRoute: "/_sentry",
      silent: true,
      // Org / project come from env so the same code works for any account.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      disableLogger: true,
    })
  : nextConfig;
