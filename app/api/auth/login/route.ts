import { authenticate, setSessionCookie, toSessionUser } from "@/lib/auth";

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

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await authenticate(email, password);
  if (!user) {
    // Deliberately vague to avoid leaking whether an email exists.
    return Response.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await setSessionCookie(user.id);
  return Response.json({ user: toSessionUser(user) });
}
