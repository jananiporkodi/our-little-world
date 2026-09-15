"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Note } from "@/lib/types";
import NoteModal from "./NoteModal";
import { playPaperSound } from "@/lib/paperSound";
import { styleForId } from "@/lib/noteStyles";

export default function NoteCard({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const [unfolding, setUnfolding] = useState(false);
  const style = styleForId(note.id);

  function handleOpen() {
    playPaperSound();
    setUnfolding(true);
    setTimeout(() => {
      setOpen(true);
      setUnfolding(false);
    }, 240);
  }

  return (
    <>
      <div style={{ perspective: 700 }}>
        <motion.button
          onClick={handleOpen}
          whileHover={{ y: -3 }}
          animate={unfolding ? { scaleY: 0.06, rotateX: 75, opacity: 0.35 } : { scaleY: 1, rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: "easeIn" }}
          style={{ transformOrigin: "top center", backgroundColor: style.bg }}
          className={`relative w-full aspect-square shadow-[0_3px_10px_rgba(20,20,20,0.08)] text-left ${style.border}`}
        >
          {style.tape && (
            <span
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-4 rounded-sm shadow-sm ${style.tapeRotate ?? ""}`}
              style={{ backgroundColor: style.tape, opacity: 0.85 }}
            />
          )}
          <span className={`absolute text-lg ${style.cornerClass}`}>{style.corner}</span>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl">💌</span>
            <span className="text-[11px] text-ink-soft font-semibold tracking-wide">tap to open</span>
            <span className="text-[10px] text-ink-soft/60">{note.author || "us"}</span>
          </div>
        </motion.button>
      </div>

      {open && <NoteModal note={note} onClose={() => setOpen(false)} />}
    </>
  );
}
