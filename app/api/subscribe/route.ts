import { getCurrentUser, setUserPro, toSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Dev-mode subscribe: flips the current user's isPro flag to true.
 * In production this should redirect to a Stripe Checkout session URL.
 * Keeping it as a POST so it can't be triggered by a GET preview / crawler.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  const updated = await setUserPro(user.id, true);
  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json({ user: toSessionUser(updated) });
}
