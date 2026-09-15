"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Note } from "@/lib/types";
import NoteModal from "./NoteModal";
import NoteDoodle from "./NoteDoodles";
import { playPaperSound } from "@/lib/paperSound";
import { styleForId } from "@/lib/noteStyles";

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

export default function NoteCard({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const style = styleForId(note.id);

  function handleOpen() {
    playPaperSound();
    setOpen(true);
  }

  return (
    <>
      <motion.button
        onClick={handleOpen}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        style={{
          backgroundColor: style.bg,
          backgroundImage: `repeating-linear-gradient(${style.bg} 0px, ${style.bg} 25px, ${style.lineColor} 26px)`,
        }}
        className={`relative w-full aspect-[4/3] p-4 pt-6 flex flex-col text-left shadow-[0_3px_10px_rgba(20,20,20,0.08)] ${style.borderClass}`}
      >
        <NoteDoodle variant={style.doodle} />

        <p className="font-patrick text-base text-ink leading-[26px] line-clamp-4 whitespace-pre-wrap flex-1">
          {note.body}
        </p>

        <div className="flex justify-between items-center pt-1.5 text-[10px] text-ink-soft/80">
          <span>{note.author ? `— ${note.author}` : "— us"}</span>
          <span>
            {timeAgo(note.created_at)} {note.mood ? `· ${note.mood}` : ""}
          </span>
        </div>
      </motion.button>

      {open && <NoteModal note={note} onClose={() => setOpen(false)} />}
    </>
  );
}
