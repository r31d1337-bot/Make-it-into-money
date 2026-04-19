# minr

Make what you know pay. A Next.js app that turns any skill into:

- A monetization plan (streamed from Claude with real market data via web search)
- A one-page ATS-friendly resume
- A three-paragraph cover letter
- A tactical interview-prep guide tailored to any job posting

Stack: Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · `@anthropic-ai/sdk` with streaming.

## Setup

```sh
npm install
cp .env.local.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add `ANTHROPIC_API_KEY` as an environment variable.
4. Deploy.

## Features

- **Streaming monetization plan** — enter a skill/idea, get a plan streamed token-by-token.
- **Context pills** — optional quick selectors for time-available, budget, and tech comfort; plans get tailored.
- **Follow-up chat** — keep asking questions after the first plan; full conversation history sent back each turn.
- **Shareable links** — "Share" button saves the plan and copies a `/p/[id]` URL to your clipboard.
- **History sidebar** — past plans saved in `localStorage` on your device.
- **Print / PDF** — print-optimized CSS for clean exports.

## How it works

- `app/page.tsx` — client UI with chat, context pills, history drawer, share + print buttons.
- `app/api/monetize/route.ts` — streaming Claude endpoint. Accepts full message history + optional context.
- `app/api/share/route.ts` — saves a plan to disk, returns a shortid.
- `app/p/[id]/page.tsx` — server-rendered view of a shared plan (supports OG metadata).
- `lib/store.ts` — dev share-plan store, writes JSON to `.data/shares/`. **Production note:** swap this for Vercel KV / Upstash Redis before deploying — the local JSON store won't persist on serverless.
- Model: `claude-sonnet-4-6`. System prompt in `app/api/monetize/route.ts`.
