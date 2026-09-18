"use client";

import { useState, useTransition } from "react";
import { sendReaction } from "@/app/(app)/home-actions";
import { REACTION_TYPES, type ReactionType } from "@/lib/reactions";

export default function ReactionDock({
  initialSentCounts,
  initialReceivedCounts,
}: {
  initialSentCounts: Record<ReactionType, number>;
  initialReceivedCounts: Record<ReactionType, number>;
}) {
  const [sent, setSent] = useState(initialSentCounts);
  const [received] = useState(initialReceivedCounts);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<ReactionType | null>(null);

  function handleSend(type: ReactionType) {
    setSent((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setFlash(type);
    setTimeout(() => setFlash((f) => (f === type ? null : f)), 1300);

    startTransition(async () => {
      const { sent: ok } = await sendReaction(type);
      if (!ok) {
        // identity isn't set up on this device - undo the optimistic bump
        setSent((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
      }
    });
  }

  return (
    <div className="fixed right-2.5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {REACTION_TYPES.map((r) => (
        <div key={r.key} className="relative">
          <button
            onClick={() => handleSend(r.key)}
            disabled={pending}
            title={`Send a ${r.label.toLowerCase()} · you've sent ${sent[r.key]} · received ${received[r.key]}`}
            aria-label={`Send a ${r.label.toLowerCase()}`}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-paper/90 dark:bg-paper-dark/90 backdrop-blur-sm shadow-sm border border-black/[0.06] dark:border-white/10 hover:scale-110 transition text-base"
          >
            {r.emoji}
          </button>

          {/* sent by me - bottom right, accent */}
          {sent[r.key] > 0 && (
            <span
              className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-sm"
              aria-label={`${sent[r.key]} sent`}
              title="sent"
            >
              ↑{sent[r.key] > 99 ? "99+" : sent[r.key]}
            </span>
          )}

          {/* received by me - top left, sage */}
          {received[r.key] > 0 && (
            <span
              className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-sage text-bezel text-[9px] font-bold flex items-center justify-center shadow-sm"
              aria-label={`${received[r.key]} received`}
              title="received"
            >
              ↓{received[r.key] > 99 ? "99+" : received[r.key]}
            </span>
          )}

          {flash === r.key && (
            <span className="absolute top-1/2 right-full mr-2 -translate-y-1/2 text-[11px] font-bold text-accent whitespace-nowrap bg-paper dark:bg-paper-dark px-2 py-1 rounded-full shadow-sm animate-bounce">
              sent! {r.emoji} (↑{sent[r.key]})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
