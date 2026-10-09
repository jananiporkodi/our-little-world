"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

// ---- Music box: an original little waltz, synthesized live (no audio files, no copyrighted tunes) ----

const UNIT = 0.3; // seconds per eighth note
const N = {
  C4: 261.63, G3: 196, F3: 174.61, A3: 220, E3: 164.81,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66,
};
// Each bar: 6 eighth-note melody slots (0 = rest) and a bass root.
const BARS: { m: number[]; bass: number; fifth: number }[] = [
  { m: [N.E5, N.G5, N.C6, N.G5, N.E5, N.G5], bass: N.C4, fifth: N.G3 },
  { m: [N.D5, N.G5, N.B5, N.G5, N.D5, N.G5], bass: N.G3, fifth: N.D5 / 2 },
  { m: [N.C5, N.E5, N.A5, N.E5, N.C5, N.E5], bass: N.A3, fifth: N.E3 * 2 },
  { m: [N.C5, N.F5, N.A5, N.F5, N.C5, N.F5], bass: N.F3, fifth: N.C4 },
  { m: [N.E5, N.G5, N.C6, N.B5, N.A5, N.G5], bass: N.C4, fifth: N.G3 },
  { m: [N.F5, N.A5, N.C6, N.A5, N.F5, N.A5], bass: N.F3, fifth: N.C4 },
  { m: [N.G5, N.B5, N.D6, N.B5, N.G5, N.B5], bass: N.G3, fifth: N.D5 / 2 },
  { m: [N.C6, 0, N.E5, N.G5, N.C6, 0], bass: N.C4, fifth: N.G3 },
];
const LOOP_SECONDS = BARS.length * 6 * UNIT;

function useMusicBox() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const echoRef = useRef<DelayNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextLoopRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  const note = useCallback((ctx: AudioContext, dest: AudioNode, freq: number, when: number, vol: number, len: number) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    g.connect(dest);
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = freq;
    o1.connect(g);
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o2.connect(g2);
    g2.connect(g);
    o1.start(when);
    o2.start(when);
    o1.stop(when + len + 0.05);
    o2.stop(when + len + 0.05);
  }, []);

  const scheduleLoop = useCallback(
    (ctx: AudioContext, dest: AudioNode, start: number) => {
      BARS.forEach((bar, b) => {
        const barStart = start + b * 6 * UNIT;
        bar.m.forEach((f, i) => {
          if (f) note(ctx, dest, f, barStart + i * UNIT, 0.5, 1.3);
        });
        note(ctx, dest, bar.bass, barStart, 0.35, 1.6);
        note(ctx, dest, bar.fifth, barStart + 3 * UNIT, 0.18, 1.0);
      });
    },
    [note]
  );

  const start = useCallback(() => {
    type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioCtx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) {
      const ctx = new AudioCtx();
      // A soft echo gives it the shimmery music-box feel.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.32;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.28;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(ctx.destination);
      echoRef.current = delay;
      ctxRef.current = ctx;
    }
    const ctx = ctxRef.current;
    // A fresh master per start, so notes queued before a pause can't leak into the next play.
    masterRef.current?.disconnect();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    master.connect(echoRef.current!);
    masterRef.current = master;
    void ctx.resume();
    nextLoopRef.current = ctx.currentTime + 0.1;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Keep one loop scheduled ahead.
      while (nextLoopRef.current < ctx.currentTime + 2) {
        scheduleLoop(ctx, master, nextLoopRef.current);
        nextLoopRef.current += LOOP_SECONDS;
      }
    }, 400);
    setPlaying(true);
  }, [scheduleLoop]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      // Quick fade, then cut this play's whole signal path so queued notes never sound.
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1);
      setTimeout(() => master.disconnect(), 500);
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void ctxRef.current?.close();
    };
  }, []);

  return { playing, start, stop };
}

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

// ---- Small background icons (each animates in place) ----

function WatchSvg() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 40 40">
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

function PaniPooriSvg() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 40 40">
      <circle cx="20" cy="24" r="12" fill="#e9b45d" />
      <circle cx="16" cy="20" r="3" fill="#f6d28b" opacity=".7" />
      <ellipse cx="20" cy="14" rx="7" ry="3" fill="#7a4a1f" />
      <ellipse cx="20" cy="14" rx="5" ry="1.8" fill="#6bbf6b" />
      <circle className="bday-drip" cx="29" cy="12" r="2.4" fill="#6bbf6b" />
    </svg>
  );
}

const BG_ICONS: React.ReactNode[] = [
  "🚗",
  "🌙",
  "🥕",
  <WatchSvg key="watch" />,
  "✈️",
  "☕",
  <PaniPooriSvg key="pani" />,
  "❤️",
  "🥦",
  "🍅",
  "💗",
];

const ANIMS = ["bday-a-bob", "bday-a-sway", "bday-a-twinkle", "bday-a-pulse"];

function BackgroundIcons() {
  const icons = useMemo(() => {
    const COLS = 6;
    const ROWS = 11;
    const out: { left: number; top: number; icon: React.ReactNode; anim: string; delay: number; dur: number; size: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        // Deterministic jitter so the pattern looks scattered but never changes between renders.
        const jx = ((i * 53) % 100) / 100 - 0.5;
        const jy = ((i * 31) % 100) / 100 - 0.5;
        out.push({
          left: ((c + 0.5 + jx * 0.7 + (r % 2) * 0.5) / COLS) * 100,
          top: ((r + 0.5 + jy * 0.6) / ROWS) * 100,
          icon: BG_ICONS[(i * 7 + r) % BG_ICONS.length],
          anim: ANIMS[i % ANIMS.length],
          delay: (i % 11) * 0.37,
          dur: 2.4 + (i % 5) * 0.5,
          size: 18 + (i % 3) * 4,
        });
      }
    }
    return out;
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`absolute ${ic.anim}`}
          style={{
            left: `${ic.left}%`,
            top: `${ic.top}%`,
            fontSize: ic.size,
            lineHeight: 1,
            opacity: 0.28,
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
  const music = useMusicBox();

  function blowOut() {
    if (!candleLit) {
      setCandleLit(true);
      return;
    }
    setCandleLit(false);
    setBurst((b) => b + 1);
    // Browsers only allow sound after a tap, so the first candle tap kicks the music off too.
    if (!music.playing) music.start();
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

        /* Background icons: each one animates in place */
        @keyframes bday-a-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes bday-a-sway { 0%,100% { transform: rotate(-12deg) } 50% { transform: rotate(12deg) } }
        @keyframes bday-a-twinkle { 0%,100% { transform: scale(1); opacity: .15 } 50% { transform: scale(1.25); opacity: .4 } }
        @keyframes bday-a-pulse { 0%,100% { transform: scale(.9) } 50% { transform: scale(1.18) } }
        .bday-a-bob, .bday-a-sway, .bday-a-twinkle, .bday-a-pulse { animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
        .bday-a-bob { animation-name: bday-a-bob }
        .bday-a-sway { animation-name: bday-a-sway }
        .bday-a-twinkle { animation-name: bday-a-twinkle }
        .bday-a-pulse { animation-name: bday-a-pulse }
        @keyframes bday-eq { 0%,100% { height: 4px } 50% { height: 16px } }
        .bday-eq { animation: bday-eq .7s ease-in-out infinite; }
        @keyframes bday-tick { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) } }
        .bday-hand { transform-origin: 20px 20px; animation: bday-tick 4s linear infinite; }
        @keyframes bday-drip { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(3px) scale(1.15) } }
        .bday-drip { animation: bday-drip 1.4s ease-in-out infinite; transform-origin: 50% 0; }
      `}</style>

      <BackgroundIcons />
      <Confetti burst={burst} />

      <button
        onClick={() => (music.playing ? music.stop() : music.start())}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white/90 shadow-lg px-4 py-2.5 text-sm font-semibold text-ink hover:scale-105 transition"
        aria-label={music.playing ? "Pause music" : "Play music"}
      >
        <span className="flex items-end gap-[2px] h-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full bg-accent ${music.playing ? "bday-eq" : ""}`}
              style={{ height: music.playing ? undefined : 5, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
        {music.playing ? "pause music" : "play music 🎵"}
      </button>

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
