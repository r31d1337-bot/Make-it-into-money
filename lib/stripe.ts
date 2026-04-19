import Stripe from "stripe";
import type { ProPlan } from "./auth";

/**
 * Server-side Stripe client. Never import this from a client component.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (and to your Vercel env vars in production).",
    );
  }
  return new Stripe(key);
}

/**
 * Maps our app's plan names to the Stripe Price IDs created in the dashboard.
 * Add the IDs to .env.local as STRIPE_PRICE_{MONTHLY,YEARLY,LIFETIME}. They
 * are public-safe identifiers (start with `price_`) — not secrets.
 */
export function priceIdFor(plan: ProPlan): string {
  const key =
    plan === "monthly"
      ? "STRIPE_PRICE_MONTHLY"
      : plan === "yearly"
        ? "STRIPE_PRICE_YEARLY"
        : "STRIPE_PRICE_LIFETIME";
  const id = process.env[key];
  if (!id) {
    throw new Error(
      `${key} is not set. Create a Stripe Price for the "${plan}" plan in the dashboard (Products → New) and add its price_... ID to .env.local.`,
    );
  }
  return id;
}

/** Monthly + yearly are subscriptions; lifetime is a one-time payment. */
export function checkoutModeFor(plan: ProPlan): "subscription" | "payment" {
  return plan === "lifetime" ? "payment" : "subscription";
}
