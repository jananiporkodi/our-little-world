/**
 * Cute, journal-sticker-style frames for Love Jar notes - pastel background, a soft
 * dashed/scalloped border, an optional washi-tape strip, and a small doodle accent.
 * Picked deterministically from the note's id so the same note always keeps the same
 * "skin" (and the card + its open modal always match), while the grid as a whole
 * cycles through a handful of looks for variety.
 */
export type NoteStyle = {
  bg: string;
  border: string;
  tape?: string;
  tapeRotate?: string;
  corner: string;
  cornerClass: string;
};

export const NOTE_STYLES: NoteStyle[] = [
  { bg: "#F6F1FA", border: "border-2 border-dashed border-[#C9AEE0] rounded-[28px]", corner: "🪻", cornerClass: "bottom-2.5 left-2.5" },
  { bg: "#FDF1F2", border: "border-2 border-[#F3B6C0] rounded-2xl", tape: "#F3B6C0", tapeRotate: "-rotate-3", corner: "🌷", cornerClass: "bottom-2.5 right-2.5" },
  { bg: "#EFF6FC", border: "border-2 border-dashed border-[#A9D2EF] rounded-[32px]", corner: "☁️", cornerClass: "top-2.5 right-2.5" },
  { bg: "#FBF3E4", border: "border-2 border-[#E3C58C] rounded-2xl", tape: "#E9CE9C", tapeRotate: "rotate-2", corner: "🧸", cornerClass: "bottom-2.5 right-2.5" },
  { bg: "#F1F7EC", border: "border-2 border-dashed border-[#B7D9A0] rounded-[30px]", corner: "🌼", cornerClass: "bottom-2.5 right-2.5" },
  { bg: "#FCEEF0", border: "border-2 border-[#F0AFC0] rounded-2xl", corner: "🎀", cornerClass: "top-2.5 right-2.5" },
  { bg: "#FDF7E3", border: "border-2 border-[#F0D77E] rounded-2xl", corner: "⭐", cornerClass: "top-2.5 left-2.5" },
  { bg: "#F6F0FB", border: "border-2 border-[#CBAEE3] rounded-2xl", tape: "#CBAEE3", tapeRotate: "-rotate-2", corner: "🌸", cornerClass: "bottom-2.5 right-2.5" },
];

export function styleForId(id: string): NoteStyle {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return NOTE_STYLES[hash % NOTE_STYLES.length];
}
