"use client";

import type { Note } from "@/lib/types";

function fullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function NoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-5 shadow-xl border border-black/[0.06] relative"
        style={{
          backgroundImage:
            "repeating-linear-gradient(var(--tw-note-bg,#FFFDF8) 0px, var(--tw-note-bg,#FFFDF8) 27px, rgba(239,227,207,0.6) 28px)",
          backgroundColor: "#FFFDF8",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-sm shadow"
          aria-label="Close"
        >
          ✕
        </button>
        <p className="font-patrick text-lg text-ink leading-[28px] whitespace-pre-wrap pr-8">{note.body}</p>
        <div className="flex justify-between items-center mt-3 text-[11px] text-ink-soft">
          <span>{note.author ? `— ${note.author}` : "— us"}</span>
          <span>
            {fullDate(note.created_at)} {note.mood ? `· ${note.mood}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
