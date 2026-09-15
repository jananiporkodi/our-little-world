"use client";

import { useState } from "react";
import type { Note } from "@/lib/types";
import NoteModal from "./NoteModal";

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

export default function NoteCard({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl p-4 shadow-[0_2px_10px_rgba(20,20,20,0.06)] border border-black/[0.06] text-left w-full hover:-translate-y-0.5 transition"
        style={{
          backgroundImage:
            "repeating-linear-gradient(var(--tw-note-bg,#FFFDF8) 0px, var(--tw-note-bg,#FFFDF8) 27px, rgba(239,227,207,0.6) 28px)",
          backgroundColor: "#FFFDF8",
        }}
      >
        <p className="font-patrick text-lg text-ink leading-[28px] line-clamp-2 whitespace-pre-wrap">{note.body}</p>
        <div className="flex justify-between items-center mt-2 text-[11px] text-ink-soft">
          <span>{note.author ? `— ${note.author}` : "— us"}</span>
          <span>
            {timeAgo(note.created_at)} {note.mood ? `· ${note.mood}` : ""}
          </span>
        </div>
      </button>

      {open && <NoteModal note={note} onClose={() => setOpen(false)} />}
    </>
  );
}
