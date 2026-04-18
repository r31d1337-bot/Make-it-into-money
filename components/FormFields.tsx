"use client";

export function Input({
  label,
  hint,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      />
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  mono = true,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-y rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
          mono ? "font-mono text-sm" : "text-base"
        }`}
      />
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}
