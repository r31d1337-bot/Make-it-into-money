import {
  setSessionCookie,
  toSessionUser,
  updateUserPassword,
  validatePassword,
} from "@/lib/auth";
import { consumeResetToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });
  if (!validatePassword(password)) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const userId = await consumeResetToken(token);
  if (!userId) {
    return Response.json(
      { error: "This reset link is invalid or expired. Request a new one." },
      { status: 400 },
    );
  }

  const result = await updateUserPassword(userId, password);
  if (result.error || !result.user) {
    return Response.json({ error: result.error || "Update failed" }, { status: 500 });
  }

  // Sign the user in with a fresh session so they can proceed immediately.
  await setSessionCookie(result.user.id);
  return Response.json({ user: toSessionUser(result.user) });
}
