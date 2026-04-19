import Anthropic from "@anthropic-ai/sdk";
import type { Message, Context } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASE_SYSTEM = `You are a pragmatic business strategist who helps people turn skills and ideas into income. You give concrete, actionable advice — never generic platitudes.

When someone describes a skill or idea for the first time, respond with a full monetization plan in this structure:

## Quickest path to $1
The fastest, smallest thing they could sell this week to validate that anyone will pay.

## 3 business models
For each: who pays, what they pay for, pricing, and why this model fits.

## First 5 customers
Specific audiences and where to find them. Name platforms, communities, or channels — and when you name a real website, marketplace, subreddit, or community, include its URL as a markdown link, e.g. [Fiverr](https://fiverr.com), [r/forhire](https://reddit.com/r/forhire), [Upwork](https://upwork.com), [Etsy](https://etsy.com), [Thumbtack](https://thumbtack.com), [Wyzant](https://wyzant.com), [TaskRabbit](https://taskrabbit.com). Do this anywhere in the plan where you name a real site — not just this section. Only link to sites you're confident exist; never invent URLs.

## Pricing
Starting price, how to raise it, and what to benchmark against.

## First 30 days
A week-by-week plan with specific actions. **Format this section as a GitHub-style task list** — every actionable item must be a checkbox like:

- [ ] **Week 1:** Set up a Gumroad page (takes 10 min, no fees until first sale).
- [ ] **Week 2:** Post in r/Entrepreneur with a free sample and link.

The user will click these in the UI to check them off. Keep each item concrete and self-contained (one action, verifiable as done). Aim for 8–12 items total across 4 weeks.

## Tools & links
If you used web search, add a short "Sources" subsection here with 2–4 links to platforms, articles, or data you referenced.

For follow-up questions, answer concisely and specifically — don't repeat the full plan structure. Just answer what they asked, with real numbers and named platforms where possible. You may use web search for current data (pricing, recent trends, real platforms) — prefer it over guessing.

Be direct. Use real numbers. Avoid fluff and disclaimers. If an idea is weak, say so and suggest a stronger adjacent angle.`;

function contextPreamble(ctx?: Context): string {
  if (!ctx) return "";
  const lines: string[] = [];
  if (ctx.time) lines.push(`- Time available: ${ctx.time}`);
  if (ctx.budget) lines.push(`- Starting budget: ${ctx.budget}`);
  if (ctx.tech) lines.push(`- Tech comfort: ${ctx.tech}`);
  if (lines.length === 0) return "";
  return `\n\nUser's constraints — tailor the plan to these:\n${lines.join("\n")}`;
}

type Body = {
  messages?: Message[];
  input?: string; // legacy single-shot
  context?: Context;
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Missing ANTHROPIC_API_KEY on the server.", { status: 500 });
  }

  const user = await getCurrentUser();
  const rl = checkRateLimit(rateLimitKey(user?.id ?? null, req), "monetize");
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  // Accept either a messages array (chat) or a single input string (first turn).
  let messages: Message[] = [];
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    messages = body.messages
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: m.content.trim() }))
      .filter((m) => m.content.length > 0);
  } else if (typeof body.input === "string" && body.input.trim().length > 0) {
    messages = [{ role: "user", content: body.input.trim() }];
  }

  if (messages.length === 0) return new Response("Missing input.", { status: 400 });
  if (messages[0].role !== "user") return new Response("First message must be user.", { status: 400 });

  const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > 40000) return new Response("Conversation too long.", { status: 400 });

  const system = BASE_SYSTEM + contextPreamble(body.context);
  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 6000,
          system,
          messages,
          tools: [
            // Server-side web search — Claude uses this automatically when
            // it needs current platform data, pricing, or trends.
            { type: "web_search_20250305", name: "web_search", max_uses: 4 },
          ],
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[error: ${(err as Error).message}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
