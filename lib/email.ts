import { Resend } from "resend";

/**
 * Build an absolute URL for email links. Prefers NEXT_PUBLIC_SITE_URL (set in
 * production), falls back to the request's own origin, and finally localhost
 * so dev works without any config.
 */
export function buildAbsoluteUrl(req: Request, path: string): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (envOrigin) return `${envOrigin}${path}`;
  const origin = req.headers.get("origin");
  if (origin) return `${origin}${path}`;
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

/**
 * Resend client. Free tier allows 3k emails/month (100/day), plenty for a
 * starting product. Set up at https://resend.com:
 *   1. Sign up → copy API key (re_…) → add to .env.local as RESEND_API_KEY
 *   2. Verify a domain (optional for prod) → add EMAIL_FROM=mintr <hi@yourdomain.com>
 *      Until then, sends from onboarding@resend.dev but CAN ONLY DELIVER to
 *      the email you registered on Resend with. Fine for testing.
 */
export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Get a free key at resend.com and add it to .env.local.",
    );
  }
  return new Resend(key);
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "mintr <onboarding@resend.dev>";
}

function baseStyle(): string {
  return `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a; line-height: 1.5;`;
}

function btnStyle(): string {
  return `background: linear-gradient(to bottom right, #a78bfa, #7c3aed); color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 14px;`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "Verify your mintr email",
    html: `
<div style="${baseStyle()}">
  <h1 style="font-size: 22px; margin: 0 0 16px;">Confirm your email</h1>
  <p style="margin: 0 0 24px;">Click the button below to finish setting up your mintr account:</p>
  <p style="margin: 0 0 28px;">
    <a href="${url}" style="${btnStyle()}">Verify email</a>
  </p>
  <p style="font-size: 13px; color: #666; margin: 0 0 8px;">Or paste this link into your browser:</p>
  <p style="font-size: 12px; color: #888; word-break: break-all; margin: 0 0 32px;">${url}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
  <p style="font-size: 12px; color: #999; margin: 0;">If you didn't sign up for mintr, you can safely ignore this email.</p>
</div>`.trim(),
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "Reset your mintr password",
    html: `
<div style="${baseStyle()}">
  <h1 style="font-size: 22px; margin: 0 0 16px;">Reset your password</h1>
  <p style="margin: 0 0 24px;">Click the button below to choose a new password. The link expires in 1 hour:</p>
  <p style="margin: 0 0 28px;">
    <a href="${url}" style="${btnStyle()}">Reset password</a>
  </p>
  <p style="font-size: 13px; color: #666; margin: 0 0 8px;">Or paste this link into your browser:</p>
  <p style="font-size: 12px; color: #888; word-break: break-all; margin: 0 0 32px;">${url}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
  <p style="font-size: 12px; color: #999; margin: 0;">If you didn't request a password reset, someone may be trying to access your account. You can ignore this email safely — your password won't change unless you click the link.</p>
</div>`.trim(),
  });
}
