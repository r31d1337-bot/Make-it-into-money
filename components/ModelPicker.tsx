"use client";

import { useEffect, useState } from "react";

export type ModelChoice = "opus" | "sonnet";

const STORAGE_KEY = "money.model.choice";

export function useModelChoice(): [ModelChoice, (v: ModelChoice) => void] {
  const [choice, setChoice] = useState<ModelChoice>("opus");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "sonnet" || stored === "opus") setChoice(stored);
    } catch {
      // ignore
    }
  }, []);

  function set(v: ModelChoice) {
    setChoice(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
  }

  return [choice, set];
}

type Option = {
  value: ModelChoice;
  label: string;
  hint: string;
};

const OPTIONS: Option[] = [
  { value: "opus", label: "Opus 4.7", hint: "sharpest · default" },
  { value: "sonnet", label: "Sonnet 4.6", hint: "faster · draftier" },
];

/**
 * Segmented control for Pro users to pick between Opus 4.7 and Sonnet 4.6.
 * Remembers the choice in localStorage so it persists across pages / visits.
 */
export default function ModelPicker({
  value,
  onChange,
  disabled,
}: {
  value: ModelChoice;
  onChange: (v: ModelChoice) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
        Model
      </label>
      <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-1">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
                active
                  ? "bg-purple-500/15 text-purple-100"
                  : "text-neutral-400 hover:text-white disabled:opacity-50"
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-[10px] text-neutral-500">{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
