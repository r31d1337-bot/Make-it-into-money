import { findUserByEmail, validateEmail } from "@/lib/auth";
import { buildAbsoluteUrl, sendPasswordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * Request a password-reset email. ALWAYS returns 200 so attackers can't
 * enumerate which emails have accounts. Rate-limited by IP so someone
 * can't spam the endpoint for 1000s of emails.
 */
export async function POST(req: Request) {
  // Tight rate limit — abuse here triggers a lot of outbound email.
  const rl = checkRateLimit(rateLimitKey(null, req), "share");
  if (!rl.ok) return rateLimitResponse(rl);

  let email = "";
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.email === "string") email = body.email;
  } catch {
    // fall through
  }

  // Always return a vague success message. If the email actually exists and
  // Resend is configured, fire off the reset email.
  if (email && validateEmail(email)) {
    const user = await findUserByEmail(email);
    if (user) {
      try {
        const token = await createResetToken(user.id);
        const url = buildAbsoluteUrl(req, `/reset-password?token=${token}`);
        await sendPasswordResetEmail(user.email, url);
      } catch (err) {
        // Log only — still return "success" to the client.
        console.warn(
          "[forgot-password] could not send reset email:",
          (err as Error).message,
        );
      }
    }
  }

  return Response.json({
    ok: true,
    message: "If an account exists for that email, we've sent a reset link.",
  });
}
