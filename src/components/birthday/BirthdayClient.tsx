"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

interface Photo {
  url: string;
  caption: string | null;
}

const TILTS = [-4, 3, -2, 5, -5, 2, -3, 4, -1];
const CONFETTI_COLORS = ["#e0556f", "#ffc9d6", "#ffd9c2", "#d8c9f0", "#f7c948", "#7ec8a4"];

function Confetti({ burst }: { burst: number }) {
  // Re-keyed on each burst so the animation replays.
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 14) * 0.08,
        duration: 2.6 + (i % 7) * 0.35,
        size: 6 + (i % 4) * 3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
        drift: ((i % 9) - 4) * 18,
      })),
    []
  );
  return (
    <div key={burst} className="pointer-events-none fixed inset-0 overflow-hidden z-40" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="bday-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            borderRadius: p.round ? "999px" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

const HEARTS = [
  { left: "8%", size: 18, dur: 9, delay: 0 },
  { left: "24%", size: 14, dur: 11, delay: 3 },
  { left: "41%", size: 20, dur: 10, delay: 6 },
  { left: "58%", size: 15, dur: 12, delay: 1.5 },
  { left: "74%", size: 19, dur: 9.5, delay: 4.5 },
  { left: "90%", size: 16, dur: 11, delay: 7.5 },
];

function WatchIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" className="bday-bob" style={{ animationDelay: ".4s" }}>
      <rect x="13" y="2" width="14" height="8" rx="2" fill="#9a8f8f" />
      <rect x="13" y="30" width="14" height="8" rx="2" fill="#9a8f8f" />
      <circle cx="20" cy="20" r="12" fill="#fff" stroke="#2f2a2a" strokeWidth="2.5" />
      <line x1="20" y1="20" x2="20" y2="13" stroke="#2f2a2a" strokeWidth="2" strokeLinecap="round" />
      <g className="bday-hand">
        <line x1="20" y1="20" x2="20" y2="11" stroke="#e0556f" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <circle cx="20" cy="20" r="1.8" fill="#2f2a2a" />
    </svg>
  );
}

function CafeIcon() {
  return (
    <span className="relative inline-block bday-bob" style={{ animationDelay: ".9s" }}>
      <span className="text-3xl leading-none">☕</span>
      <svg width="30" height="16" viewBox="0 0 30 16" className="absolute -top-3 left-1/2 -translate-x-1/2" aria-hidden>
        <path className="bday-steam" d="M9 14 C5 9 13 7 9 2" stroke="#b8aeae" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path className="bday-steam" style={{ animationDelay: ".7s" }} d="M18 14 C14 9 22 7 18 2" stroke="#b8aeae" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function PaniPooriIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" className="bday-bob" style={{ animationDelay: "1.3s" }}>
      <circle cx="20" cy="24" r="12" fill="#e9b45d" />
      <circle cx="16" cy="20" r="3" fill="#f6d28b" opacity=".7" />
      <ellipse cx="20" cy="14" rx="7" ry="3" fill="#7a4a1f" />
      <ellipse cx="20" cy="14" rx="5" ry="1.8" fill="#6bbf6b" />
      <circle className="bday-drip" cx="29" cy="12" r="2.4" fill="#6bbf6b" />
    </svg>
  );
}

const ICON_ROW: { label: string; node: React.ReactNode }[] = [
  { label: "road trips", node: <span className="bday-bob text-3xl" style={{ animationDelay: "0s" }}>🚗</span> },
  { label: "late nights", node: <span className="bday-bob text-3xl" style={{ animationDelay: ".2s" }}>🌙</span> },
  { label: "fresh veggies", node: <span className="bday-bob text-3xl" style={{ animationDelay: ".6s" }}>🥕🥦</span> },
  { label: "every moment", node: <WatchIcon /> },
  { label: "wanderlust", node: <span className="bday-bob text-3xl" style={{ animationDelay: "1.1s" }}>✈️</span> },
  { label: "cafe dates", node: <CafeIcon /> },
  { label: "panipoori", node: <PaniPooriIcon /> },
  { label: "always", node: <span className="bday-bob text-3xl" style={{ animationDelay: "1.6s" }}>❤️</span> },
];

const BALLOONS = [
  { left: "6%", color: "#e0556f", delay: 0, size: 54 },
  { left: "17%", color: "#ffc9d6", delay: 1.2, size: 44 },
  { left: "83%", color: "#d8c9f0", delay: 0.6, size: 50 },
  { left: "93%", color: "#ffd9c2", delay: 1.8, size: 42 },
];

export default function BirthdayClient({
  name,
  fromName,
  age,
  daysTogether,
  photos,
}: {
  name: string;
  fromName: string;
  age: number;
  daysTogether: number | null;
  photos: Photo[];
}) {
  const [candleLit, setCandleLit] = useState(true);
  const [burst, setBurst] = useState(1);

  function blowOut() {
    if (!candleLit) {
      setCandleLit(true);
      return;
    }
    setCandleLit(false);
    setBurst((b) => b + 1);
  }

  return (
    <div className="min-h-dvh bg-cream text-ink relative overflow-x-hidden">
      <style>{`
        @keyframes bday-fall { 0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 1 } 100% { transform: translate3d(var(--drift),110vh,0) rotate(720deg); opacity: .9 } }
        .bday-confetti { position: absolute; top: 0; animation-name: bday-fall; animation-timing-function: linear; animation-fill-mode: both; }
        @keyframes bday-float { 0%,100% { transform: translateY(0) rotate(-3deg) } 50% { transform: translateY(-22px) rotate(3deg) } }
        .bday-balloon { position: fixed; bottom: -10px; animation: bday-float 5s ease-in-out infinite; z-index: 1; opacity: .85; }
        @keyframes bday-flicker { 0%,100% { transform: scale(1) rotate(-2deg) } 50% { transform: scale(1.12, 1.2) rotate(2deg) } }
        .bday-flame { animation: bday-flicker .5s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes bday-pop { 0% { transform: scale(.6); opacity: 0 } 70% { transform: scale(1.06) } 100% { transform: scale(1); opacity: 1 } }
        .bday-pop { animation: bday-pop .8s cubic-bezier(.2,.8,.3,1) both; }
        @keyframes bday-rise { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .bday-rise { animation: bday-rise .8s ease both; }
        @keyframes bday-plane { 0% { transform: translateX(-12vw) translateY(0) rotate(-4deg) } 50% { transform: translateX(50vw) translateY(-14px) rotate(2deg) } 100% { transform: translateX(112vw) translateY(0) rotate(-4deg) } }
        .bday-plane { position: fixed; top: 9%; left: 0; font-size: 30px; animation: bday-plane 16s linear infinite; z-index: 1; pointer-events: none; }
        @keyframes bday-car { 0% { transform: translateX(112vw) scaleX(-1) } 100% { transform: translateX(-14vw) scaleX(-1) } }
        @keyframes bday-bounce { 0%,100% { margin-bottom: 0 } 50% { margin-bottom: 3px } }
        .bday-car { position: fixed; bottom: 6px; left: 0; font-size: 30px; animation: bday-car 14s linear infinite; z-index: 1; pointer-events: none; }
        .bday-car span { display: inline-block; animation: bday-bounce .35s ease-in-out infinite; }
        @keyframes bday-glow { 0%,100% { filter: drop-shadow(0 0 4px #f7c948); transform: rotate(-8deg) } 50% { filter: drop-shadow(0 0 14px #f7c948); transform: rotate(8deg) } }
        .bday-moon { position: fixed; top: 14px; right: 18px; font-size: 38px; animation: bday-glow 4s ease-in-out infinite; z-index: 1; pointer-events: none; }
        @keyframes bday-bob { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-10px) rotate(6deg) } }
        .bday-bob { display: inline-block; animation: bday-bob 2.6s ease-in-out infinite; }
        @keyframes bday-tick { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) } }
        .bday-hand { transform-origin: 50% 50%; animation: bday-tick 4s linear infinite; }
        @keyframes bday-steam { 0% { transform: translateY(0) scaleX(1); opacity: 0 } 40% { opacity: .8 } 100% { transform: translateY(-14px) scaleX(1.6); opacity: 0 } }
        .bday-steam { animation: bday-steam 2s ease-out infinite; transform-origin: 50% 100%; }
        @keyframes bday-heart-up { 0% { transform: translateY(0) scale(.6); opacity: 0 } 15% { opacity: .9 } 100% { transform: translateY(-105vh) scale(1.2); opacity: 0 } }
        .bday-heart { position: fixed; bottom: -30px; z-index: 1; pointer-events: none; animation: bday-heart-up linear infinite; }
        @keyframes bday-drip { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(3px) scale(1.15) } }
        .bday-drip { animation: bday-drip 1.4s ease-in-out infinite; transform-origin: 50% 0; }
      `}</style>

      <Confetti burst={burst} />

      {BALLOONS.map((b, i) => (
        <div key={i} className="bday-balloon" style={{ left: b.left, animationDelay: `${b.delay}s` }} aria-hidden>
          <svg width={b.size} height={b.size * 2.1} viewBox="0 0 40 84">
            <ellipse cx="20" cy="22" rx="17" ry="21" fill={b.color} />
            <ellipse cx="13" cy="14" rx="4" ry="7" fill="#fff" opacity=".35" />
            <path d="M20 43 l-3 5 h6 z" fill={b.color} />
            <path d="M20 48 C14 58 26 66 20 82" stroke="#9a8f8f" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      ))}

      {/* Ambient animated icons */}
      <div className="bday-plane" aria-hidden>✈️</div>
      <div className="bday-car" aria-hidden><span>🚗</span></div>
      <div className="bday-moon" aria-hidden>🌙</div>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="bday-heart"
          aria-hidden
          style={{ left: h.left, fontSize: h.size, animationDuration: `${h.dur}s`, animationDelay: `${h.delay}s` }}
        >
          {i % 2 === 0 ? "❤️" : "💗"}
        </span>
      ))}

      <main className="relative z-10 max-w-3xl mx-auto px-5 py-10 sm:py-16">
        {/* Hero */}
        <section className="text-center mb-14">
          <p className="bday-rise text-sm tracking-widest uppercase text-ink-soft mb-3">9 · October</p>
          <h1 className="bday-pop font-hand text-6xl sm:text-8xl leading-[0.95] text-accent">
            Happy Birthday,
            <br />
            {name}!
          </h1>
          <p className="bday-rise font-patrick text-xl sm:text-2xl mt-5 text-ink-soft" style={{ animationDelay: ".3s" }}>
            {age} looks so good on you 🎂
          </p>

          {/* Cake with a blow-able candle */}
          <button
            onClick={blowOut}
            className="mt-8 inline-flex flex-col items-center group"
            aria-label={candleLit ? "Blow out the candle" : "Relight the candle"}
          >
            <svg width="150" height="150" viewBox="0 0 150 150" className="transition-transform group-hover:scale-105">
              <rect x="70" y="30" width="10" height="34" rx="3" fill="#f7c948" />
              {candleLit && (
                <g className="bday-flame">
                  <path d="M75 12 C66 24 68 33 75 33 C82 33 84 24 75 12 Z" fill="#ff9f43" />
                  <path d="M75 20 C71 26 72 31 75 31 C78 31 79 26 75 20 Z" fill="#ffe08a" />
                </g>
              )}
              <rect x="25" y="64" width="100" height="30" rx="8" fill="#ffc9d6" />
              <path d="M25 74 q10 12 20 0 t20 0 t20 0 t20 0 t20 0 v-4 H25 Z" fill="#fff" opacity=".9" />
              <rect x="15" y="92" width="120" height="38" rx="10" fill="#e0556f" />
              <circle cx="45" cy="111" r="4" fill="#ffd9c2" />
              <circle cx="75" cy="115" r="4" fill="#ffd9c2" />
              <circle cx="105" cy="111" r="4" fill="#ffd9c2" />
              <rect x="8" y="128" width="134" height="8" rx="4" fill="#d8c9f0" />
            </svg>
            <span className="text-xs text-ink-soft mt-1">
              {candleLit ? "tap to blow out the candle & make a wish" : "wish made ✨ (tap to relight)"}
            </span>
          </button>
        </section>

        {/* Photos */}
        {photos.length > 0 && (
          <section className="mb-16">
            <p className="font-hand text-3xl sm:text-4xl text-center mb-8">us, so far 📸</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
              {photos.map((p, i) => (
                <figure
                  key={p.url}
                  className="bday-rise bg-white p-2 pb-6 shadow-lg rounded-sm"
                  style={{ transform: `rotate(${TILTS[i % TILTS.length]}deg)`, animationDelay: `${0.1 * i}s` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-black/5">
                    <Image src={p.url} alt={p.caption ?? ""} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                  </div>
                  {p.caption && (
                    <figcaption className="font-patrick text-center text-sm mt-2 text-ink-soft truncate">{p.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Wishes */}
        <section className="mb-14 space-y-5">
          <div className="bg-white/80 rounded-3xl shadow-md p-6 sm:p-8 text-center">
            <p className="font-hand text-3xl mb-3">Dear {name},</p>
            <p className="font-patrick text-xl sm:text-2xl leading-relaxed">
              Thank you for being my calm, my laughter, and my favourite person to do absolutely nothing with.
              Every plan is better with you in it, and every ordinary day turns into a memory when you&apos;re around.
            </p>
            <p className="font-patrick text-xl sm:text-2xl leading-relaxed mt-4">
              I hope this year gives you everything you keep quietly giving to me. 💛
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: "🌟", title: "Wish #1", text: "May every goal you quietly work on this year come true." },
              { emoji: "🍕", title: "Wish #2", text: "More good food, more trips, more lazy Sundays together." },
              { emoji: "🫶", title: "Wish #3", text: "May you always feel as loved as you make me feel." },
            ].map((w) => (
              <div key={w.title} className="bg-peach/60 rounded-2xl p-5 text-center">
                <p className="text-3xl mb-1">{w.emoji}</p>
                <p className="font-hand text-xl mb-1">{w.title}</p>
                <p className="font-patrick text-lg leading-snug">{w.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/70 rounded-3xl shadow-sm px-4 py-5">
            <p className="font-hand text-2xl text-center mb-4">things that remind me of us</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-5">
              {ICON_ROW.map((it) => (
                <div key={it.label} className="flex flex-col items-center gap-1.5 w-16">
                  <div className="h-10 flex items-center justify-center">{it.node}</div>
                  <span className="text-[10px] text-ink-soft text-center leading-tight">{it.label}</span>
                </div>
              ))}
            </div>
          </div>

          {daysTogether !== null && (
            <p className="text-center text-sm text-ink-soft">
              {daysTogether} days together so far, and I&apos;d happily do every one of them again.
            </p>
          )}
        </section>

        <footer className="text-center pb-6">
          <p className="font-hand text-3xl text-accent">I love you, happy birthday! ❤️</p>
          <p className="font-patrick text-xl mt-2 text-ink-soft">— {fromName}</p>
          <button onClick={() => setBurst((b) => b + 1)} className="btn-primary mt-8 !px-8">
            more confetti 🎉
          </button>
        </footer>
      </main>
    </div>
  );
}
