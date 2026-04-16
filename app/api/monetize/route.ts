import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a pragmatic business strategist who helps people turn skills and ideas into income. Someone will describe a skill, expertise, or idea. You give them a concrete, actionable monetization plan — not generic advice.

Structure your response as:

## Quickest path to $1
The fastest, smallest thing they could sell this week to validate that anyone will pay.

## 3 business models
For each: who pays, what they pay for, pricing, and why this model fits.

## First 5 customers
Specific audiences and where to find them. Name platforms, communities, or channels.

## Pricing
Starting price, how to raise it, and what to benchmark against.

## First 30 days
A week-by-week plan with specific actions.

Be direct. Use real numbers. Avoid fluff, disclaimers, and "it depends." If the idea is weak, say so — and suggest an adjacent angle that's stronger.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Missing ANTHROPIC_API_KEY on the server.", { status: 500 });
  }

  let input: string;
  try {
    const body = await req.json();
    input = typeof body?.input === "string" ? body.input.trim() : "";
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }
  if (!input) return new Response("Missing input.", { status: 400 });
  if (input.length > 4000) return new Response("Input too long (max 4000 chars).", { status: 400 });

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input }],
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
