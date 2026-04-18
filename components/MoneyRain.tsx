"use client";

import { useMemo } from "react";

const EMOJI = ["💵"];
const COUNT = 120;

type Drop = {
  left: number; // vw
  delay: number; // s
  duration: number; // s
  size: number; // rem
  rotate: number; // deg
  emoji: string;
};

/**
 * Non-interactive overlay that rains banknote emojis from above.
 * Keyframes and animation are inlined so Tailwind v4 can't purge them,
 * and positions are memoized per-mount so React re-renders during
 * streaming don't reshuffle the drops.
 */
export default function MoneyRain() {
  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: COUNT }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.2 + Math.random() * 1.6,
      size: 1.25 + Math.random() * 1.5,
      rotate: (Math.random() - 0.5) * 90,
      emoji: EMOJI[Math.floor(Math.random() * EMOJI.length)],
    }));
  }, []);

  return (
    <>
      <style>{`
        @keyframes moneyFall {
          0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.9; }
          100% { transform: translate3d(0, 110vh, 0) rotate(var(--rot, 0deg)); opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .money-rain { display: none; }
        }
      `}</style>
      <div
        aria-hidden
        className="money-rain pointer-events-none fixed inset-0 z-30 overflow-hidden"
      >
        {drops.map((d, i) => (
          <span
            key={i}
            className="absolute top-0 will-change-transform"
            style={{
              left: `${d.left}vw`,
              fontSize: `${d.size}rem`,
              animation: `moneyFall ${d.duration}s linear ${d.delay}s infinite`,
              filter: "drop-shadow(0 4px 12px rgba(120, 80, 255, 0.25))",
              userSelect: "none",
              // CSS custom prop consumed by the keyframe's rotate()
              ["--rot" as string]: `${d.rotate}deg`,
            }}
          >
            {d.emoji}
          </span>
        ))}
      </div>
    </>
  );
}
