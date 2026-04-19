import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Redirect current user to Stripe's customer portal so they can manage their
 * payment method, cancel subscription, or change plan.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  if (!user.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer on file yet" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    req.headers.get("origin") ||
    `http://${req.headers.get("host") ?? "localhost:3000"}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/account`,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
