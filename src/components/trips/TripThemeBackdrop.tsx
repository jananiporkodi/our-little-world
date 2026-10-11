"use client";

import { useMemo } from "react";
import type { TripTheme } from "@/lib/tripTheme";

const ANIMS = ["tt-bob", "tt-sway", "tt-twinkle", "tt-pulse"];

/** A soft tint of the destination's colors, with small themed icons gently animating in place. */
export default function TripThemeBackdrop({ theme }: { theme: TripTheme }) {
  const icons = useMemo(() => {
    const COLS = 5;
    const ROWS = 9;
    const out: { left: number; top: number; icon: string; anim: string; delay: number; dur: number; size: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const jx = ((i * 53) % 100) / 100 - 0.5;
        const jy = ((i * 31) % 100) / 100 - 0.5;
        out.push({
          left: ((c + 0.5 + jx * 0.7 + (r % 2) * 0.5) / COLS) * 100,
          top: ((r + 0.5 + jy * 0.6) / ROWS) * 100,
          icon: theme.icons[(i * 3 + r) % theme.icons.length],
          anim: ANIMS[i % ANIMS.length],
          delay: (i % 9) * 0.41,
          dur: 2.6 + (i % 5) * 0.55,
          size: 18 + (i % 3) * 4,
        });
      }
    }
    return out;
  }, [theme]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      <style>{`
        @keyframes tt-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes tt-sway { 0%,100% { transform: rotate(-12deg) } 50% { transform: rotate(12deg) } }
        @keyframes tt-twinkle { 0%,100% { transform: scale(1); opacity: .12 } 50% { transform: scale(1.25); opacity: .35 } }
        @keyframes tt-pulse { 0%,100% { transform: scale(.9) } 50% { transform: scale(1.15) } }
        .tt-bob, .tt-sway, .tt-twinkle, .tt-pulse { animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .tt-bob { animation-name: tt-bob } .tt-sway { animation-name: tt-sway }
        .tt-twinkle { animation-name: tt-twinkle } .tt-pulse { animation-name: tt-pulse }
      `}</style>
      <div className="absolute inset-0" style={{ background: theme.gradient, opacity: 0.35 }} />
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`absolute ${ic.anim}`}
          style={{
            left: `${ic.left}%`,
            top: `${ic.top}%`,
            fontSize: ic.size,
            lineHeight: 1,
            opacity: 0.25,
            animationDelay: `${ic.delay}s`,
            animationDuration: `${ic.dur}s`,
          }}
        >
          {ic.icon}
        </span>
      ))}
    </div>
  );
}
