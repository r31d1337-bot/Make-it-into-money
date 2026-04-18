"use client";

import { useState } from "react";

function formatUSD(n: number): string {
  if (!isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${Math.round(n / 1000).toLocaleString()}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function RevenueCalculator() {
  const [rate, setRate] = useState<number>(50);
  const [hours, setHours] = useState<number>(10);

  const weekly = rate * hours;
  const monthly = weekly * 4.33; // avg weeks/month
  const annual = weekly * 52;

  return (
    <section className="no-print rounded-xl border border-neutral-900 bg-neutral-950/60 p-6">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Revenue calculator
      </h3>
      <p className="mb-5 text-xs text-neutral-500">
        Back-of-the-envelope. Sliders or type a number.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Rate" prefix="$" suffix="/hr" value={rate} onChange={setRate} min={5} max={500} step={5} />
        <Field label="Hours" suffix="/week" value={hours} onChange={setHours} min={1} max={60} step={1} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Stat label="per week" value={formatUSD(weekly)} />
        <Stat label="per month" value={formatUSD(monthly)} accent />
        <Stat label="per year" value={formatUSD(annual)} />
      </div>
    </section>
  );
}

function Field({
  label,
  prefix,
  suffix,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-wider text-neutral-500">{label}</label>
        <span className="text-sm tabular-nums text-neutral-200">
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 ${
        accent
          ? "border-purple-500/40 bg-purple-500/10"
          : "border-neutral-800 bg-neutral-950"
      }`}
    >
      <div className={`text-xl font-semibold tabular-nums ${accent ? "text-purple-100" : "text-white"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
    </div>
  );
}
