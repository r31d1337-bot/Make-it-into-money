"use client";

import { useMemo } from "react";

const EMOJI = ["💵", "💰", "💸", "🤑", "💴", "💶"];
const COUNT = 32;

type Drop = {
  left: number; // vw
  delay: number; // s
  duration: number; // s
  size: number; // rem
  rotate: number; // deg
  emoji: string;
};

/**
 * Non-interactive overlay that rains money emojis from above.
 * Render it conditionally; positions are memoized per-mount so the drops
 * look stable (not re-shuffled) while React re-renders during streaming.
 */
export default function MoneyRain() {
  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: COUNT }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 3,
      size: 1.25 + Math.random() * 1.5,
      rotate: (Math.random() - 0.5) * 90,
      emoji: EMOJI[Math.floor(Math.random() * EMOJI.length)],
    }));
  }, []);

  return (
    <div
      aria-hidden
      className="money-rain pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {drops.map((d, i) => (
        <span
          key={i}
          className="money-drop absolute top-0 will-change-transform"
          style={{
            left: `${d.left}vw`,
            fontSize: `${d.size}rem`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            // Randomize rotation via CSS var consumed by @keyframes
            ["--rot" as string]: `${d.rotate}deg`,
          }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  );
}
