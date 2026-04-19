import { saveShare, newId } from "@/lib/store";
import type { Message, Context, SharedPlan } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";

type Body = {
  idea: string;
  context?: Context;
  messages: Message[];
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const rl = checkRateLimit(rateLimitKey(user?.id ?? null, req), "share");
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!idea) return Response.json({ error: "Missing idea" }, { status: 400 });
  if (messages.length === 0) return Response.json({ error: "Missing messages" }, { status: 400 });
  if (idea.length > 2000) return Response.json({ error: "Idea too long" }, { status: 400 });

  const totalChars = messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
  if (totalChars > 100_000) return Response.json({ error: "Plan too long to share" }, { status: 400 });

  const plan: SharedPlan = {
    id: newId(),
    idea: idea.slice(0, 2000),
    context: body.context,
    messages: messages.map((m) => ({
      role: m.role,
      content: (m.content ?? "").toString(),
    })),
    createdAt: Date.now(),
  };

  try {
    await saveShare(plan);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  return Response.json({ id: plan.id });
}
