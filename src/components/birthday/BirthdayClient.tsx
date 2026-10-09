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
