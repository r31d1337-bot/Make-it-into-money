# mintr

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
# edit .env.local and set ANTHROPIC_API_KEY (+ Stripe keys below)
npm run dev
```

Open http://localhost:3000.

### Env vars

```
# Required for the free Turn-This-Into-Money tool
ANTHROPIC_API_KEY=sk-ant-...

# Required for Pro billing (Stripe). Use sk_test_ / pk_test_ during development.
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Set these after creating 3 Prices in Stripe dashboard → Products
# (Monthly recurring $7.99, Yearly recurring $79, Lifetime one-time $249).
# Price IDs are public-safe (start with price_). Add them to .env.local.
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...

# Set after registering a webhook (see below).
STRIPE_WEBHOOK_SECRET=whsec_...

# Email — required for signup verification and password reset.
# Sign up at https://resend.com (free, 3k emails/month).
RESEND_API_KEY=re_...

# Optional — falls back to onboarding@resend.dev.
# EMAIL_FROM=mintr <hi@yourdomain.com>

# Set in production so email links point at the real site.
# NEXT_PUBLIC_SITE_URL=https://mintr.app
```

### Stripe setup (one-time)

1. **API keys:** Stripe dashboard → **Developers → API keys** → copy the Secret and Publishable keys. Use **Test mode** while developing.
2. **Products:** Stripe dashboard → **Products → Add product** — create three:
   - *mintr Pro Monthly*: Recurring, $7.99/month
   - *mintr Pro Yearly*: Recurring, $79/year
   - *mintr Pro Lifetime*: One-time, $249
3. Click each product, copy the **price_...** ID from the pricing section, paste into `.env.local` as `STRIPE_PRICE_{MONTHLY,YEARLY,LIFETIME}`.
4. **Webhook (local dev):** `brew install stripe/stripe-cli/stripe`, then:
   ```sh
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   The CLI prints a `whsec_...` signing secret — copy it into `STRIPE_WEBHOOK_SECRET`.
5. **Webhook (production):** Stripe dashboard → **Developers → Webhooks → Add endpoint** → `https://your-domain.com/api/stripe/webhook` → select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret into your Vercel env vars.

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
