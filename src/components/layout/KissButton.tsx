"use client";

import { useState, useTransition } from "react";
import { sendKiss } from "@/app/(app)/home-actions";

export default function KissButton() {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const { sent } = await sendKiss();
      setFeedback(sent ? "sent! 💕" : "pick who you are in Settings first");
      setTimeout(() => setFeedback(null), 2200);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={pending}
        aria-label="Send a kiss"
        title="Send a kiss"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-paper/90 dark:bg-paper-dark/90 backdrop-blur-sm shadow-sm border border-black/[0.06] dark:border-white/10 hover:scale-110 transition text-base"
      >
        💋
      </button>
      {feedback && (
        <span className="absolute top-full right-0 mt-1.5 text-[11px] font-bold text-accent whitespace-nowrap bg-paper dark:bg-paper-dark px-2 py-1 rounded-full shadow-sm animate-bounce">
          {feedback}
        </span>
      )}
    </div>
  );
}
