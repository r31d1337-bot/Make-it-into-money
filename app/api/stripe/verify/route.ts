import {
  getCurrentUser,
  setStripeCustomer,
  setUserPro,
  toSessionUser,
  type ProPlan,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Fallback path when webhooks aren't configured (no STRIPE_WEBHOOK_SECRET).
 * Called from /account after Stripe's success redirect. We re-fetch the
 * session from Stripe, confirm it's paid, and flip the user's Pro flag.
 *
 * Security: we only flip Pro if
 *   1. the session belongs to the currently-signed-in user
 *      (via metadata.appUserId, which we set at checkout.create time)
 *   2. payment_status === "paid"
 *
 * Limitation vs webhooks: no visibility into renewals, failed payments,
 * or portal cancellations. For long-term reliability add the webhook
 * secret and this route becomes redundant.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  let sessionId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.sessionId === "string") sessionId = body.sessionId;
  } catch {}
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return Response.json({ error: "Missing or invalid sessionId" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const sessionUserId = session.metadata?.appUserId;
  if (sessionUserId !== user.id) {
    // Don't leak "wrong user" vs "no metadata" — just deny.
    return Response.json({ error: "Session does not belong to you" }, { status: 403 });
  }

  if (session.payment_status !== "paid") {
    return Response.json(
      { error: `Payment not completed (status: ${session.payment_status})` },
      { status: 400 },
    );
  }

  const plan = (session.metadata?.plan as ProPlan | undefined) ?? "monthly";

  // Persist the Stripe customer so future portal / webhook flows work.
  if (typeof session.customer === "string" && !user.stripeCustomerId) {
    await setStripeCustomer(user.id, session.customer);
  }

  if (plan === "lifetime") {
    const updated = await setUserPro(user.id, "lifetime", { subscriptionId: null });
    return Response.json({ user: updated ? toSessionUser(updated) : null });
  }

  // Subscription — stamp the real period_end if available.
  let expiresAt: number | null = null;
  let subscriptionId: string | null = null;
  const sub = session.subscription;
  if (sub && typeof sub === "object" && "id" in sub) {
    subscriptionId = sub.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodEnd = (sub as any).current_period_end as number | undefined;
    if (periodEnd) expiresAt = periodEnd * 1000;
  } else if (typeof sub === "string") {
    subscriptionId = sub;
  }

  const updated = await setUserPro(user.id, plan, { subscriptionId, expiresAt });
  return Response.json({ user: updated ? toSessionUser(updated) : null });
}
