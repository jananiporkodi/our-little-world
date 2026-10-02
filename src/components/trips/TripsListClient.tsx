"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import type { Trip } from "@/lib/types";
import { TRIP_EMOJIS } from "@/lib/types";
import { formatDateRange } from "@/lib/dates";
import { getTripState, tripDurationDays } from "@/lib/trips";
import { addTrip, deleteTrip } from "@/app/(app)/trips/actions";

const STATE_CHIP: Record<string, string> = {
  upcoming: "bg-lavender text-bezel",
  ongoing: "bg-blush text-accent",
  completed: "bg-black/5 dark:bg-white/10 text-ink-soft",
};

const STATE_LABEL: Record<string, string> = {
  upcoming: "upcoming",
  ongoing: "happening now",
  completed: "past trip",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary !py-2 !px-4 text-sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function AddTripForm({ onDone }: { onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [emoji, setEmoji] = useState<string>(TRIP_EMOJIS[0]);
  const [startDate, setStartDate] = useState("");

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("coverEmoji", emoji);
        await addTrip(formData);
        formRef.current?.reset();
        setEmoji(TRIP_EMOJIS[0]);
        onDone();
      }}
      className="card-panel p-4 space-y-2.5"
    >
      <p className="font-hand text-xl">Plan a trip</p>
      <div className="flex flex-wrap gap-1.5">
        {TRIP_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-lg border transition ${
              emoji === e ? "border-accent bg-peach/50" : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/5"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <input name="title" placeholder="Trip name, e.g. Mumbai getaway" className="input-field" required />
      <input name="destination" placeholder="Destination (optional)" className="input-field" />
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="date"
          name="startDate"
          className="input-field"
          required
          onChange={(e) => setStartDate(e.target.value)}
          title="Start date"
        />
        <input type="date" name="endDate" min={startDate} className="input-field" title="End date" />
      </div>
      <textarea name="notes" placeholder="Any notes? (optional)" className="input-field" rows={2} />
      <div className="flex gap-2 pt-1">
        <SubmitButton label="add trip" pendingLabel="Adding…" />
        <button type="button" onClick={onDone} className="btn-ghost !py-2 !px-3 text-sm">
          cancel
        </button>
      </div>
    </form>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const state = getTripState(trip);
  const days = tripDurationDays(trip);

  return (
    <div className="card-panel p-4 flex items-start gap-3">
      <span className="text-3xl leading-none">{trip.cover_emoji}</span>
      <div className="flex-1 min-w-0">
        <Link href={`/trips/${trip.id}`} className="font-hand text-2xl leading-tight hover:text-accent transition">
          {trip.title}
        </Link>
        {trip.destination && <p className="text-sm text-ink-soft mt-0.5">📍 {trip.destination}</p>}
        <p className="text-[11px] text-ink-soft mt-0.5">
          {formatDateRange(trip.start_date, trip.end_date)} · {days} day{days === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`chip text-[10px] !py-0.5 !px-2 ${STATE_CHIP[state]}`}>{STATE_LABEL[state]}</span>
          {trip.memory_id && <span className="text-accent text-xs">♥ saved as memory</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Link href={`/trips/${trip.id}`} className="btn-ghost !py-1 !px-2 text-[11px]">
          open
        </Link>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirmingDelete) {
              setConfirmingDelete(true);
              return;
            }
            startTransition(() => deleteTrip(trip.id));
          }}
          className={`btn-ghost !py-1 !px-2 text-[11px] ${confirmingDelete ? "text-accent" : ""}`}
        >
          {confirmingDelete ? "confirm?" : "delete"}
        </button>
      </div>
    </div>
  );
}

export default function TripsListClient({ trips }: { trips: Trip[] }) {
  const [adding, setAdding] = useState(false);

  const grouped = useMemo(() => {
    const ongoing: Trip[] = [];
    const upcoming: Trip[] = [];
    const past: Trip[] = [];
    for (const trip of trips) {
      const state = getTripState(trip);
      if (state === "ongoing") ongoing.push(trip);
      else if (state === "upcoming") upcoming.push(trip);
      else past.push(trip);
    }
    upcoming.sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
    past.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
    return { ongoing, upcoming, past };
  }, [trips]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="font-hand text-4xl md:text-5xl leading-none">Our trips 🧳</p>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm">
          + plan a trip
        </button>
      </div>
      <p className="text-sm text-ink-soft mb-5">everywhere we&apos;re going, and everywhere we&apos;ve been</p>

      {adding && (
        <div className="mb-5">
          <AddTripForm onDone={() => setAdding(false)} />
        </div>
      )}

      {trips.length === 0 && !adding && (
        <p className="text-sm text-ink-soft">No trips yet - plan your first one!</p>
      )}

      {grouped.ongoing.length > 0 && (
        <div className="mb-6">
          <p className="font-hand text-xl mb-2">Happening now</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {grouped.ongoing.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </div>
      )}

      {grouped.upcoming.length > 0 && (
        <div className="mb-6">
          <p className="font-hand text-xl mb-2">Upcoming</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {grouped.upcoming.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </div>
      )}

      {grouped.past.length > 0 && (
        <div className="mb-6">
          <p className="font-hand text-xl mb-2">Past trips</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {grouped.past.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
