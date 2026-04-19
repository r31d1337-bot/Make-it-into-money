import { getCurrentUser } from "@/lib/auth";
import { buildAbsoluteUrl, sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * Resend a verification email to the currently signed-in user.
 * Rate-limited aggressively to prevent abuse as a mail-bomb.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  if (user.emailVerifiedAt) {
    return Response.json({ ok: true, alreadyVerified: true });
  }

  // Cap to 5 resends per day per user/IP.
  const rl = checkRateLimit(rateLimitKey(user.id, req), "share");
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const token = await createVerificationToken(user.id);
    const url = buildAbsoluteUrl(req, `/verify-email?token=${token}`);
    await sendVerificationEmail(user.email, url);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
