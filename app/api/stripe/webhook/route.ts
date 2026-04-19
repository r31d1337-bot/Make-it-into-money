import type Stripe from "stripe";
import {
  findUserById,
  findUserByStripeCustomerId,
  setStripeCustomer,
  setUserPro,
  type ProPlan,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
// Webhooks must NOT be cached.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * Set up: Stripe dashboard → Developers → Webhooks → Add endpoint:
 *   URL   → https://<your-domain>/api/stripe/webhook
 *   Events → checkout.session.completed
 *            customer.subscription.updated
 *            customer.subscription.deleted
 * Copy the signing secret (whsec_...) into STRIPE_WEBHOOK_SECRET in .env.local.
 *
 * Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * (requires `brew install stripe/stripe-cli/stripe` + `stripe login`). The
 * CLI prints a temporary whsec_... to use in your dev .env.local.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("STRIPE_WEBHOOK_SECRET not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      default:
        // Ignore events we don't care about. Still 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    // Log and 500 — Stripe will retry.
    console.error("[stripe webhook]", event.type, (err as Error).message);
    return new Response("Webhook handler error", { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
) {
  const appUserId = session.metadata?.appUserId;
  const plan = (session.metadata?.plan as ProPlan | undefined) ?? "monthly";
  if (!appUserId) return;

  const user = await findUserById(appUserId);
  if (!user) return;

  // Link the Stripe customer to our user if we didn't already.
  if (typeof session.customer === "string" && !user.stripeCustomerId) {
    await setStripeCustomer(appUserId, session.customer);
  }

  if (plan === "lifetime") {
    // One-time payment — no subscription, no expiry.
    await setUserPro(appUserId, "lifetime", { subscriptionId: null });
    return;
  }

  // Subscription plan — pull the period end so we can surface renewal dates.
  let expiresAt: number | null = null;
  let subscriptionId: string | null = null;
  if (typeof session.subscription === "string") {
    subscriptionId = session.subscription;
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      // Stripe types may vary across API versions; fall back to "any" for the
      // period_end lookup.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (sub as any).current_period_end as number | undefined;
      if (periodEnd) expiresAt = periodEnd * 1000;
    } catch {
      // leave expiresAt as null; renewal still works from next invoice
    }
  }

  await setUserPro(appUserId, plan, { subscriptionId, expiresAt });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const user = await findUserByAppOrCustomer(sub);
  if (!user) return;

  // Cancel immediately on cancel_at_period_end → not until period ends.
  const plan =
    (sub.metadata?.plan as ProPlan | undefined) ?? user.proPlan ?? "monthly";
  if (plan === "lifetime") return; // shouldn't happen, but be safe

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = (sub as any).current_period_end as number | undefined;
  const expiresAt = periodEnd ? periodEnd * 1000 : null;

  // Still considered active if the sub is in a billable state, even if it's
  // scheduled to cancel at period end (user keeps access till then).
  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  if (!activeStatuses.has(sub.status)) {
    await setUserPro(user.id, null);
    return;
  }

  await setUserPro(user.id, plan, {
    subscriptionId: sub.id,
    expiresAt,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const user = await findUserByAppOrCustomer(sub);
  if (!user) return;
  await setUserPro(user.id, null);
}

async function findUserByAppOrCustomer(sub: Stripe.Subscription) {
  const appUserId = sub.metadata?.appUserId;
  if (appUserId) {
    const user = await findUserById(appUserId);
    if (user) return user;
  }
  if (typeof sub.customer === "string") {
    return findUserByStripeCustomerId(sub.customer);
  }
  return null;
}
