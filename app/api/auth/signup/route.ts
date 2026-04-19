import { createUser, setSessionCookie, toSessionUser } from "@/lib/auth";
import { buildAbsoluteUrl, sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const { user, error } = await createUser(email, password);
  if (error || !user) {
    return Response.json({ error: error || "Signup failed" }, { status: 400 });
  }

  await setSessionCookie(user.id);

  // Fire-and-forget verification email. If Resend isn't configured yet (dev
  // before the key is added), log and move on so signup still works.
  try {
    const token = await createVerificationToken(user.id);
    const url = buildAbsoluteUrl(req, `/verify-email?token=${token}`);
    await sendVerificationEmail(user.email, url);
  } catch (err) {
    console.warn("[signup] could not send verification email:", (err as Error).message);
  }

  return Response.json({ user: toSessionUser(user) });
}
