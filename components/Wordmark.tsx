import Link from "next/link";

/**
 * "minr" brand wordmark for the top-left of the app shell. Lowercase,
 * tracked-out, with a subtle dot separator so it reads as a logotype.
 */
export default function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="minr — home"
      className="group inline-flex items-baseline gap-0.5 font-semibold tracking-tight text-white hover:opacity-90"
    >
      <span className="text-lg">minr</span>
      <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-purple-400 transition-transform group-hover:scale-110" aria-hidden />
    </Link>
  );
}
