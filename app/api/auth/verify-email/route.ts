import { markEmailVerified, toSessionUser } from "@/lib/auth";
import { consumeVerificationToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let token: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body.token === "string") token = body.token;
  } catch {
    // fall through
  }
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const userId = await consumeVerificationToken(token);
  if (!userId) {
    return Response.json(
      { error: "This verification link is invalid or expired." },
      { status: 400 },
    );
  }

  const updated = await markEmailVerified(userId);
  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json({ user: toSessionUser(updated) });
}
