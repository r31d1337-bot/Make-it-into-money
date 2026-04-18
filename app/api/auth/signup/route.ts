import { createUser, setSessionCookie, toSessionUser } from "@/lib/auth";

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
  return Response.json({ user: toSessionUser(user) });
}
