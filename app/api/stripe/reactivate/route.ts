import {
  getCurrentUser,
  setSubscriptionCancelState,
  toSessionUser,
} from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Undo a scheduled cancellation — flip cancel_at_period_end back to false so
 * the subscription renews normally at the next period boundary.
 * Only valid before the period actually ends; once Stripe fires
 * customer.subscription.deleted the subscription is gone and the user has to
 * resubscribe via /pricing.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  if (!user.stripeSubscriptionId) {
    return Response.json({ error: "No subscription on file" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const updated = await setSubscriptionCancelState(user.id, false);
  return Response.json({ user: updated ? toSessionUser(updated) : null });
}
