import {
  getCurrentUser,
  setSubscriptionCancelState,
  toSessionUser,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Schedule the user's monthly/yearly subscription to cancel at the end of the
 * current paid period. They keep Pro access until then; when Stripe fires the
 * customer.subscription.deleted webhook, isPro flips to false automatically.
 *
 * Lifetime users have no subscription — they get a 400. Use the refund flow
 * for lifetime if a refund is warranted (manual via Stripe dashboard for now).
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  if (!user.stripeSubscriptionId) {
    return Response.json(
      {
        error:
          "No active subscription to cancel. Lifetime purchases don't auto-renew.",
      },
      { status: 400 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const updated = await setSubscriptionCancelState(user.id, true);
  return Response.json({ user: updated ? toSessionUser(updated) : null });
}
