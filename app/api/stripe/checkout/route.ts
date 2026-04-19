import { getCurrentUser, setStripeCustomer, type ProPlan } from "@/lib/auth";
import { getStripe, priceIdFor, checkoutModeFor } from "@/lib/stripe";

export const runtime = "nodejs";

const ALLOWED: ProPlan[] = ["monthly", "yearly", "lifetime"];

function originFrom(req: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Creates a Stripe Checkout session for the selected plan and returns the
 * hosted-checkout URL for the client to redirect to.
 *
 * Flow:
 *   POST /api/stripe/checkout { plan }
 *     → Stripe Checkout URL
 *     → user pays on Stripe
 *     → success_url hits /account?paid=1
 *     → webhook (/api/stripe/webhook) flips isPro server-side
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  let plan: ProPlan = "monthly";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.plan === "string" && ALLOWED.includes(body.plan as ProPlan)) {
      plan = body.plan as ProPlan;
    }
  } catch {
    // default
  }

  let stripe, priceId;
  try {
    stripe = getStripe();
    priceId = priceIdFor(plan);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const origin = originFrom(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: checkoutModeFor(plan),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      // Reuse or create a customer so the webhook can look them up by ID.
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      // Metadata is echoed back on webhook events — helps us reconcile the
      // Stripe customer to our user row.
      metadata: {
        appUserId: user.id,
        plan,
      },
      // For subscriptions, also stamp metadata on the subscription itself so
      // future subscription.updated / deleted events carry it.
      ...(checkoutModeFor(plan) === "subscription"
        ? { subscription_data: { metadata: { appUserId: user.id, plan } } }
        : {}),
      allow_promotion_codes: true,
    });

    // If Stripe created a new customer, persist the ID so subsequent events
    // can find this user without metadata.
    if (!user.stripeCustomerId && typeof session.customer === "string") {
      await setStripeCustomer(user.id, session.customer);
    }

    if (!session.url) {
      return Response.json({ error: "No checkout URL returned" }, { status: 500 });
    }
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
