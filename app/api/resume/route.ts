import Anthropic from "@anthropic-ai/sdk";
import { requirePro } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a senior recruiter and resume writer. Given rough notes about someone's background, you produce a polished, one-page, ATS-friendly professional resume.

Write in clean markdown that will render as a real resume document. Follow this structure exactly:

# Name
Contact line: email · phone · city · linkedin (include whichever the user gave you; omit the rest without comment).

## Summary
Three or four lines. Lead with what they do, add years of experience, pick two specific strengths, and name the role they're targeting. No buzzwords — no "dynamic team player", no "results-driven".

## Experience
For each role, use this format:

**Role Title** — Company · City, ST
*Month YYYY – Month YYYY*
- Achievement-focused bullet. Start with an action verb. Quantify with a number whenever the user gave you one (revenue, users, %, $, headcount).
- 3–5 bullets per role. Lead with impact, not responsibilities. "Shipped" not "was responsible for shipping."

List roles in reverse chronological order.

## Skills
Comma-separated lists grouped by category (e.g. "**Languages:** Python, TypeScript, SQL"). Only include skills the user mentioned or strongly implied — do not invent.

## Education
**Degree** — School · Year
One line per entry. GPA only if >= 3.7.

## Hard rules
- Never invent a company, role, date, metric, or credential the user didn't give you. If the user was vague, leave the section short and truthful.
- If the user only gave you a rough paragraph, infer reasonable role titles and dates from the text, but mark inferred dates with an em dash (—) instead of a specific year when unsure.
- No photos, no "References available on request", no objective/career-goal filler.
- Use strong action verbs: led, shipped, built, scaled, owned, cut, grew, reduced.
- When quantifying, be specific: "reduced page-load time from 4.2s to 1.1s" beats "improved performance".
- Match tone to the target role — formal for law/finance, more direct for tech/startups.

Output the resume only. No preamble, no closing commentary.`;

type Body = {
  name?: string;
  targetRole?: string;
  experience?: string;
  education?: string;
  skills?: string;
  contact?: string;
};

function buildUserMessage(body: Body): string {
  const parts: string[] = [];
  if (body.name?.trim()) parts.push(`Name: ${body.name.trim()}`);
  if (body.contact?.trim()) parts.push(`Contact info: ${body.contact.trim()}`);
  if (body.targetRole?.trim()) parts.push(`Target role: ${body.targetRole.trim()}`);
  if (body.experience?.trim()) parts.push(`\nWork experience:\n${body.experience.trim()}`);
  if (body.skills?.trim()) parts.push(`\nSkills:\n${body.skills.trim()}`);
  if (body.education?.trim()) parts.push(`\nEducation:\n${body.education.trim()}`);
  return parts.join("\n");
}

export async function POST(req: Request) {
  const gate = await requirePro();
  if (!gate.ok) return new Response(gate.message, { status: gate.status });

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

  const userMessage = buildUserMessage(body);
  if (!userMessage.trim()) return new Response("Missing input.", { status: 400 });
  if (userMessage.length > 20000) return new Response("Input too long.", { status: 400 });

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = client.messages.stream({
          // Pro-tier: use Opus 4.7 for sharper career outputs.
          model: "claude-opus-4-7",
          max_tokens: 4000,
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
