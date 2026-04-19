import { getCurrentUser, setUserPro, toSessionUser, type ProPlan } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED: ProPlan[] = ["monthly", "yearly", "lifetime"];

/**
 * Dev-mode subscribe: flips the current user's Pro status based on the chosen
 * plan. In production this handler should create a Stripe Checkout session
 * and the real isPro flip happens in a webhook.
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
    // fall through with default
  }

  const updated = await setUserPro(user.id, plan);
  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json({ user: toSessionUser(updated) });
}
