import Anthropic from "@anthropic-ai/sdk";
import { requirePro } from "@/lib/auth";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a senior hiring manager who has run hundreds of interview loops. Given a job posting (and optionally the candidate's background), you produce a sharp, tactical interview prep guide.

Format the output in clean markdown using this exact structure:

## Before the interview

3–5 bullet points: research angles specific to this role and company, the kind of signal the interviewer is likely screening for, and common traps for this seniority level.

## 8 likely questions

For each question (numbered 1–8), use this exact format:

### 1. [The question, written naturally]
**Why they ask:** One sentence.
**How to approach:** Tactical — what structure (STAR / SOAR / freeform), what specifically to emphasize for *this* role, what to leave out.
**Opener:** One sentence showing how to start the answer, personalized to the candidate's background if provided.

Mix of question types:
- 3 behavioral questions tied to the role's likely priorities
- 2 technical or domain questions drawn from the posting
- 1 question about motivation / "why this role"
- 1 "fit / culture" question
- 1 curveball (stress test, weakness probe, hypothetical)

## 5 questions to ask them

5 specific, non-generic questions the candidate should ask the interviewer. Each must reference something from the posting or the role's context — no "what's the company culture like?" generics.

## Red flags to watch for

3 signs during the interview that suggest this job may not be what it looks like (e.g., vague answers about scope, surprise team size, defensive reactions to process questions).

## Hard rules

- Be specific to THIS posting. Never output generic "tell me about yourself" advice.
- Never invent details about the candidate. If their background is thin or missing, focus on structure and let the "Opener" lines be generic but still tactical.
- Use direct language. No "remember to be yourself". No "dress professionally".
- Output the prep guide only. No preamble, no closing summary.`;

type Body = {
  jobDescription?: string;
  companyName?: string;
  background?: string;
  model?: "opus" | "sonnet";
};

function resolveModel(choice: Body["model"]): "claude-opus-4-7" | "claude-sonnet-4-6" {
  return choice === "sonnet" ? "claude-sonnet-4-6" : "claude-opus-4-7";
}

function buildUserMessage(body: Body): string {
  const parts: string[] = [];
  if (body.companyName?.trim()) parts.push(`Company: ${body.companyName.trim()}`);
  if (body.jobDescription?.trim()) {
    parts.push(`\nJob posting:\n${body.jobDescription.trim()}`);
  }
  if (body.background?.trim()) {
    parts.push(`\nCandidate background (resume / notes):\n${body.background.trim()}`);
  }
  return parts.join("\n");
}

export async function POST(req: Request) {
  const gate = await requirePro();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

  const rl = checkRateLimit(rateLimitKey(gate.user.id, req), "pro-tool");
  if (!rl.ok) return rateLimitResponse(rl);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Missing ANTHROPIC_API_KEY on the server.", { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  if (!body.jobDescription?.trim())
    return new Response("Job description is required.", { status: 400 });

  const userMessage = buildUserMessage(body);
  if (userMessage.length > 30000) return new Response("Input too long.", { status: 400 });

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = client.messages.stream({
          // Pro-tier: Opus 4.7 by default. Sonnet 4.6 if the user chose speed.
          model: resolveModel(body.model),
          max_tokens: 5000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
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
