import { getNotes } from "@/lib/data";
import NoteCard from "@/components/notes/NoteCard";
import AddNoteForm from "@/components/notes/AddNoteForm";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div>
      <p className="font-hand text-4xl md:text-5xl leading-none mb-1">Love Jar 🫙</p>
      <p className="text-sm text-ink-soft mb-6">little notes to each other, saved for later</p>

      <div className="mb-6">
        <AddNoteForm />
      </div>

      {pinned.length > 0 && (
        <div
          className="mb-8 rounded-3xl p-4 md:p-5 border border-black/[0.06]"
          style={{
            backgroundColor: "#E4C79C",
            backgroundImage:
              "radial-gradient(rgba(120,84,42,0.18) 1.2px, transparent 1.2px), radial-gradient(rgba(120,84,42,0.18) 1.2px, transparent 1.2px)",
            backgroundSize: "18px 18px",
            backgroundPosition: "0 0, 9px 9px",
          }}
        >
          <p className="font-hand text-2xl mb-3">📌 Pinned Wall</p>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pinned.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </div>
      )}

      {rest.length === 0 && pinned.length === 0 ? (
        <p className="text-sm text-ink-soft">No notes yet — write the first one.</p>
      ) : rest.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rest.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
