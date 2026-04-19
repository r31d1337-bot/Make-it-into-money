// One-shot: create the three Stripe Products + Prices for mintr Pro and
// append their price IDs to .env.local. Reads STRIPE_SECRET_KEY from the
// env (loaded via `node --env-file=.env.local`). Idempotent-ish: re-running
// creates duplicate products, so run it only once.
//
// Usage (from project root):
//   node --env-file=.env.local scripts/setup-stripe-products.mjs

import Stripe from "stripe";
import { promises as fs } from "fs";
import path from "path";

const PLANS = [
  {
    name: "mintr Pro Monthly",
    description: "Unlimited resume / cover letter / interview prep on Claude Opus 4.7",
    amountCents: 799,
    interval: "month",
    envVar: "STRIPE_PRICE_MONTHLY",
  },
  {
    name: "mintr Pro Yearly",
    description: "Unlimited resume / cover letter / interview prep on Claude Opus 4.7 — 17% off",
    amountCents: 7900,
    interval: "year",
    envVar: "STRIPE_PRICE_YEARLY",
  },
  {
    name: "mintr Pro Lifetime",
    description: "One-time purchase — unlimited Pro access forever",
    amountCents: 24900,
    interval: null,
    envVar: "STRIPE_PRICE_LIFETIME",
  },
];

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("✗ STRIPE_SECRET_KEY is not set in .env.local");
    process.exit(1);
  }
  const mode = key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "TEST" : "UNKNOWN";
  console.log(`→ Using Stripe ${mode} mode\n`);

  const stripe = new Stripe(key);

  const newEnvLines = [];
  for (const plan of PLANS) {
    process.stdout.write(`Creating ${plan.name.padEnd(22)} ... `);
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amountCents,
      currency: "usd",
      ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
    });
    console.log(`✓  ${price.id}`);
    newEnvLines.push(`${plan.envVar}=${price.id}`);
  }

  // Append to .env.local without overwriting existing entries.
  const envPath = path.join(process.cwd(), ".env.local");
  const existing = await fs.readFile(envPath, "utf8").catch(() => "");

  // Skip any vars already present — we don't want duplicates.
  const already = new Set(
    existing
      .split("\n")
      .map((l) => l.match(/^([A-Z_]+)=/)?.[1])
      .filter(Boolean),
  );
  const toAppend = newEnvLines.filter((line) => {
    const name = line.split("=")[0];
    if (already.has(name)) {
      console.log(`→ ${name} already in .env.local — not overwriting`);
      return false;
    }
    return true;
  });

  if (toAppend.length > 0) {
    const sep = existing.endsWith("\n") ? "" : "\n";
    await fs.writeFile(envPath, existing + sep + toAppend.join("\n") + "\n");
    console.log(`\n✓ Added ${toAppend.length} price ID(s) to .env.local`);
  } else {
    console.log("\n→ Nothing to add — all three price vars are already set.");
  }

  console.log("\nDone. Restart your dev server to pick up the new env vars.");
}

main().catch((err) => {
  console.error("\n✗ Error:", err.message);
  process.exit(1);
});
