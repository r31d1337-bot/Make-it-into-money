import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a senior hiring manager. Given a job description and the applicant's background, you write a tight, human, three-paragraph cover letter that actually gets read.

Structure the output like this:

Dear [Hiring Manager / specific name if provided],

**Paragraph 1 — Hook (2 sentences):**
Sentence 1: Why this role specifically — reference something concrete from the posting (a product, a mission, a recent launch, a hiring signal).
Sentence 2: Who you are in one line.

**Paragraph 2 — Fit (3–5 sentences):**
Two specific things from the background that match what they need. Quantify whenever possible. Tie each point directly to a requirement in the posting.

**Paragraph 3 — Close (2–3 sentences):**
One sentence on what you'd want to do in your first 30–60 days. One concrete CTA ("I'd love to dig into how you're thinking about X").

Sincerely,
[Name]

## Hard rules

- Never use: "I believe", "I am passionate about", "team player", "hit the ground running", "please find my resume attached", "dynamic", "results-driven", "self-starter".
- No apologies, no qualifiers like "while I don't have X, I...".
- Max 250 words. Short is better. Tight is better.
- Never invent companies, titles, dates, or metrics the user didn't provide.
- Use "you" / "your team" to reference the company — makes it concrete, not generic.
- Match the tone to the company: formal for law/finance/enterprise, direct and punchy for tech/startup/consumer.
- If the job posting is vague or thin, lean harder on the candidate's proven wins.
- Output the letter only. No preamble. No commentary.`;

type Body = {
  jobDescription?: string;
  companyName?: string;
  hiringManager?: string;
  name?: string;
  background?: string;
};

function buildUserMessage(body: Body): string {
  const parts: string[] = [];
  if (body.companyName?.trim()) parts.push(`Company: ${body.companyName.trim()}`);
  if (body.hiringManager?.trim()) parts.push(`Hiring manager: ${body.hiringManager.trim()}`);
  if (body.name?.trim()) parts.push(`Applicant name: ${body.name.trim()}`);
  if (body.jobDescription?.trim()) {
    parts.push(`\nJob description / posting:\n${body.jobDescription.trim()}`);
  }
  if (body.background?.trim()) {
    parts.push(`\nApplicant background (resume / notes):\n${body.background.trim()}`);
  }
  return parts.join("\n");
}

export async function POST(req: Request) {
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
  if (!body.jobDescription?.trim())
    return new Response("Job description is required.", { status: 400 });
  if (userMessage.length > 20000) return new Response("Input too long.", { status: 400 });

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const messageStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
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
