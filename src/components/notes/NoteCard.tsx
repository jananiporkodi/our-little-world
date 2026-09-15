"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Note } from "@/lib/types";
import NoteModal from "./NoteModal";
import { playPaperSound } from "@/lib/paperSound";

export default function NoteCard({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const [unfolding, setUnfolding] = useState(false);

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
          whileHover={{ y: -3, rotate: -1 }}
          animate={unfolding ? { scaleY: 0.06, rotateX: 75, opacity: 0.35 } : { scaleY: 1, rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: "easeIn" }}
          style={{ transformOrigin: "top center" }}
          className="relative w-full aspect-[4/3] rounded-lg shadow-[0_3px_10px_rgba(20,20,20,0.14)] border border-black/[0.06] overflow-hidden text-left"
        >
          <div className="absolute inset-0" style={{ backgroundColor: "#FFF3D0" }} />

          {/* folded top-right corner flap */}
          <div
            className="absolute top-0 right-0 w-9 h-9"
            style={{
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              background: "#F0DDA8",
              boxShadow: "-2px 2px 5px rgba(0,0,0,0.18)",
            }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="text-2xl">💌</span>
            <span className="text-[11px] text-ink-soft font-semibold tracking-wide">tap to open</span>
          </div>

          <div className="absolute bottom-1.5 left-0 right-0 flex justify-between items-center px-2.5 text-[10px] text-ink-soft/80">
            <span>{note.author || "us"}</span>
            {note.mood && <span>{note.mood}</span>}
          </div>
        </motion.button>
      </div>

      {open && <NoteModal note={note} onClose={() => setOpen(false)} />}
    </>
  );
}
