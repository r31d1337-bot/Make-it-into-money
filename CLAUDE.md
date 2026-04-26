# mintr — project guide for Claude

You are working on **mintr** — a live SaaS at https://mintrapp.com. This file
captures decisions, paths, and operational state that aren't obvious from
reading the code. Read it before making changes; update it when you change
anything that future-you would want to know.

Owner: Reid (r31d1337@gmail.com / r31d1337-bot on GitHub).
Repo: https://github.com/r31d1337-bot/Make-it-into-money (default branch `main`).

---

## What it does

Four AI-powered tools sharing one account:

| Path | What | Tier |
|---|---|---|
| `/monetize` | Streamed monetization plan from a skill or idea | **Free** (unlimited) |
| `/resume` | One-page ATS-friendly resume from rough notes | Pro |
| `/cover-letter` | Tight 3-paragraph cover letter from a job posting | Pro |
| `/interview-prep` | 8 tailored questions + how-to-approach guide | Pro |

Plus: `/checklist` (cross-plan task aggregator), `/discover` (public shared
plans), `/p/[id]` (shared-plan view), `/pricing`, `/account`, `/login`, `/signup`,
`/forgot-password`, `/reset-password`, `/verify-email`, `/terms`, `/privacy`,
`/support`.

## Pricing

- **Free**: unlimited monetize tool, history on device.
- **Pro Monthly**: $7.99/mo (Stripe).
- **Pro Yearly**: $79/yr (Stripe, ~17% off).
- **Pro Lifetime**: $249 one-time (Stripe).

Pro users pick **Opus 4.7 vs Sonnet 4.6** via header toggle (Pro-only,
persisted in localStorage). Free monetize tool is always Sonnet.

---

## Stack

- **Next.js 15** App Router + React 19 + Tailwind v4 (CSS-vars based theming)
- **Auth**: email + scrypt-hashed password, HMAC-signed httpOnly cookie.
  No external provider — owns its own user table.
- **DB**: SQLite via `better-sqlite3` at `.data/mintr.db`. Migrated FROM
  JSON files on 2026-04-26 — there are still `.bak` files in `.data/` you
  can clean up after a few days.
- **AI**: `@anthropic-ai/sdk`. Streaming Messages API, server-side
  `web_search_20250305` tool on monetize, GFM task-list output for the
  30-day plan that becomes interactive checkboxes.
- **Payments**: Stripe Checkout + customer portal + webhook + in-app
  cancel/reactivate. Webhook handler at `/api/stripe/webhook` syncs
  `cancel_at_period_end` from Stripe.
- **Email**: Resend. `EMAIL_FROM=mintr <hi@mintrapp.com>` (verified domain).
  Templates in `lib/email.ts`. No-op without `RESEND_API_KEY`.
- **Errors**: Sentry wired in code (instrumentation.ts + sentry.*.config.ts +
  next.config.ts withSentryConfig). **No-op until DSN is set** — Reid hasn't
  added it yet.
- **Mobile**: hamburger sheet (`components/MobileNav.tsx`) replaces desktop
  controls under `sm:` breakpoint. PWA installable, mkcert HTTPS in dev.

---

## Production deployment

- **Host**: DigitalOcean droplet at **142.93.4.80** (Ubuntu 24.04, 1 GB RAM
  + 2 GB swap). Hostname `mintr`.
- **DNS**: A records at registrar point `mintrapp.com` and `www.mintrapp.com`
  → 142.93.4.80.
- **Code path**: `/opt/mintr` (root-owned, git clone of main).
- **Process**: pm2, ecosystem at `/opt/mintr/ecosystem.config.cjs`,
  `pm2 startup systemd` so it survives reboots.
- **Reverse proxy**: nginx, config at `/etc/nginx/sites-available/mintrapp.com`
  (sourced from `/opt/mintr/deploy/nginx.conf`). Streams uncached
  (`proxy_buffering off`) for Anthropic SSE.
- **TLS**: Let's Encrypt via certbot, auto-renews. Cert covers
  `mintrapp.com` and `www.mintrapp.com`.
- **Firewall**: `ufw` allows OpenSSH + "Nginx Full" only.
- **Env**: `/opt/mintr/.env.local` (chmod 600).
- **Backups**: `/usr/local/bin/mintr-backup.sh` runs daily at 03:00 UTC via
  root crontab. Online SQLite `.backup`, integrity-checked, gzipped to
  `/var/backups/mintr/`, last 7 kept. **Currently local-only** — no
  off-droplet copy yet.
- **Logs**: pm2 → `/var/log/mintr/{out,err}.log`; backup → `/var/log/mintr/backup.log`.

### Standard deploy flow (from local laptop)

```sh
# 1. push from local
git push

# 2. on droplet
ssh root@142.93.4.80
cd /opt/mintr
git pull
npm ci          # only if dependencies changed
npm run build
pm2 restart mintr
```

For migrations or schema changes, run them between `git pull` and
`pm2 restart`.

---

## Env vars (production needs all of these)

| Var | Purpose | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API (sk-ant-...) | yes |
| `STRIPE_SECRET_KEY` | Stripe live API key (sk_live_...) | yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable (pk_live_...) | yes |
| `STRIPE_PRICE_MONTHLY` | price_... for the monthly plan | yes |
| `STRIPE_PRICE_YEARLY` | price_... for the yearly plan | yes |
| `STRIPE_PRICE_LIFETIME` | price_... for the lifetime plan | yes |
| `STRIPE_WEBHOOK_SECRET` | whsec_... from the prod webhook endpoint | yes |
| `RESEND_API_KEY` | re_... for transactional email | yes |
| `EMAIL_FROM` | `mintr <hi@mintrapp.com>` | yes |
| `AUTH_SECRET` | 32-byte hex random — **server throws on startup if missing in prod** | yes |
| `NEXT_PUBLIC_SITE_URL` | `https://mintrapp.com` (so email links use it) | yes |
| `NODE_ENV` | `production` | yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry — Sentry is no-op without it | optional |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry source-map upload | optional |
| `BACKUP_REMOTE_URL` | If set (e.g. `s3://...`), backup script also uploads remotely | optional |
| `DATABASE_PATH` | Override SQLite location | optional |

Local dev **omits** `NEXT_PUBLIC_SITE_URL` (request headers are used) and
`AUTH_SECRET` (uses a dev-only fallback that throws if `NODE_ENV=production`).

The dev script also strips `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL`
inherited from the Claude Code shell:
`env -u ANTHROPIC_API_KEY -u ANTHROPIC_BASE_URL next dev`
— without the strip, an empty shell-env var shadows `.env.local`.

---

## Important code conventions

- **Don't break the function signatures of `lib/auth.ts`, `lib/store.ts`,
  `lib/tokens.ts`.** They were JSON-backed until 2026-04-26 and are now
  SQLite-backed; the rest of the app calls them by name.
- **All API routes that touch Claude or write data are rate-limited**
  via `lib/ratelimit.ts`. New routes that hit Anthropic should call
  `checkRateLimit(rateLimitKey(...))` before doing work.
- **Pro-only routes use `requirePro()`** which returns 401 (signed out)
  or 402 (free tier) and a clear message.
- **Stripe webhook handler is the source of truth** for subscription
  state. Don't write a "fake" Pro flag from anywhere else. The
  `/api/stripe/verify` route is a fallback for the success-redirect
  case — it does the same updates the webhook would.
- **All form input → AI** runs through a system prompt in the route
  file. Edits should keep the "anti-fluff" guardrails (no
  "results-driven team player", "passionate", etc.).
- **External links in markdown output**: `components/PlanMarkdown.tsx`
  forces `target="_blank" rel="noopener noreferrer"` on any
  `https://`-prefixed URL and adds an external-link glyph.
- **GFM task lists** in plan output become real interactive checkboxes
  via `PlanMarkdown` + `lib/tasks.ts`. Checkbox state keys to
  `money.task.{planId}.{hashOfText}` in localStorage so the same task
  stays checked across the in-plan view, the `/checklist` aggregator,
  and shared `/p/[id]` views.
- **Theme**: light mode works by overriding Tailwind v4's
  `--color-neutral-*` CSS vars in `app/globals.css` under `html.light`.
  Inline-script in `app/layout.tsx` runs before hydration to prevent
  flash. Don't add new hard-coded colors that won't flip.
- **No emojis in responses to Reid by default** — he's said he doesn't
  want them in code or chat. Existing UI emojis (💵 raining, etc.) are
  intentional and should stay.

---

## Security posture & known leaks

- **Stripe live keys have been pasted in chat multiple times** (2026-04-16
  through 2026-04-21 sessions). Reid was warned each time and chose not to
  rotate. They should be rotated before significant traffic; do not rely on
  Stripe support if a fraudulent charge happens against the leaked key.
- **Resend API key**: also touched chat once but less severe.
- **Anthropic API key**: leaked in chat early on (2026-04-16). Reid
  rotated this one.
- **Stripe webhook signing secret** (`whsec_0FebTOVhC...`) was pasted in
  chat on 2026-04-26. Lower-severity than `sk_live_` but should rotate.
- **`AUTH_SECRET` on the droplet was generated server-side** by the
  install script (`openssl rand -hex 32`). Never been in chat or code.
- Cookies are `httpOnly`, `SameSite=Lax`, `Secure` in production.
- Passwords stored as `salt:scrypt-hex` (no plaintext).
- Tokens (verify + reset) stored as SHA-256 hashes only.
- Constant-time compare on session-token signatures and reset-token hashes.

---

## Open TODOs / next-session work

In priority order:

1. **Rotate Stripe keys** (`sk_live_…` and `pk_live_…`). Stripe dashboard →
   Developers → API keys → roll. Update on droplet:
   `nano /opt/mintr/.env.local && pm2 restart mintr`. Also rotate the
   webhook signing secret while there: Webhooks → click endpoint → roll
   secret → update `STRIPE_WEBHOOK_SECRET`.
2. **Add Sentry DSN**. Reid signs up at sentry.io → New Project → Next.js →
   copy DSN → SSH and append `NEXT_PUBLIC_SENTRY_DSN=...` to
   `/opt/mintr/.env.local`, `pm2 restart mintr`. Sentry starts capturing
   immediately.
3. **Off-droplet backups**. Daily backups currently land in
   `/var/backups/mintr/` only. If the droplet dies, backups die with it.
   Set up DO Spaces (~$5/mo) → install `s3cmd` or `awscli` on droplet →
   set `BACKUP_REMOTE_URL=s3://mintr-backups/` in env. Backup script
   already handles upload.
4. **Delete legacy `.bak` files** in `/opt/mintr/.data/` after
   ~2026-05-03 (one week post-migration grace period).
5. **Smoke-test the prod auth flow with a fresh email** — Reid did sign
   up + buy + cancel + resume on 2026-04-26 and all four worked.

## Things to NEVER do

- **Don't paste secrets into chat to "set them"**. Pipe from `.env.local`
  via SCP or have Reid edit on the droplet directly.
- **Don't commit `.env.local`, `.data/`, `.certs/`, `*.db`** — gitignored,
  but worth verifying after big edits.
- **Don't add a backdoor "dev mode" Pro toggle.** There used to be
  `/api/subscribe` and `/api/unsubscribe` that flipped `isPro` directly —
  they were removed when real Stripe went live. Pro flips only happen via
  Stripe webhook + the verify-fallback route.
- **Don't run `npm run build` while `npm run dev` is running** — they
  both touch `.next/` and corrupt each other. Kill dev first.
- **Don't change `lib/tasks.ts` hashing** without migrating localStorage
  task state — users would lose all their checked items.

## Conventions for working with Reid

- He'll ask for big changes in short messages ("do all four", "now what")
  and expects you to plan + execute the whole thing.
- Auto-push is enabled — commit and push without asking.
- He prefers SSH-driven server changes over web-dashboard ones when
  possible.
- Long task lists are fine but only when you'll execute them all in one
  shot. Don't list and wait.
