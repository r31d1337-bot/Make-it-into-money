# Turn This Into Money

A minimal web app: describe a skill or idea, get a concrete monetization plan streamed from Claude.

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

## How it works

- `app/page.tsx` — client form, streams tokens from the API into the UI.
- `app/api/monetize/route.ts` — server route. Calls Claude via the Anthropic SDK and pipes text deltas back as a `text/plain` stream.
- Model: `claude-opus-4-7`. System prompt in the route file.
