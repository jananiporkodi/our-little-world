"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Trip, TripLogistics, TripItem, Expense, Memory, CreditCard } from "@/lib/types";
import { paymentLabel } from "@/lib/cards";
import PaymentSelect from "@/components/expenses/PaymentSelect";
import AddMemoryForm from "@/components/memories/AddMemoryForm";
import { TripFinanceBar, TripAnalysis } from "./TripFinance";
import { resolveTripTheme, THEME_OPTIONS } from "@/lib/tripTheme";
import { TRIP_EMOJIS, TRANSPORT_MODES, WISHLIST_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";
import { formatFriendlyDate, formatDateRange, todayIST } from "@/lib/dates";
import { formatTimeRange } from "@/lib/plans";
import { getTripState, tripDurationDays, tripDayKeys, tripThemeBackground } from "@/lib/trips";
import {
  updateTrip,
  deleteTrip,
  convertTripToMemory,
  addLogistics,
  deleteLogistics,
  addTripItem,
  toggleTripItem,
  deleteTripItem,
} from "@/app/(app)/trips/actions";
import { deleteExpense } from "@/app/(app)/expenses/actions";
import { ExpenseForm } from "@/components/expenses/ExpensesClient";

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

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
    <button type="submit" className="btn-primary !py-1.5 !px-3 text-xs" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-panel p-4 mb-5">
      <p className="font-hand text-xl mb-3">{title}</p>
      {children}
    </div>
  );
}

// ---------- Header / overview ----------

function EditTripForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [emoji, setEmoji] = useState(trip.cover_emoji);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [removeCoverPhoto, setRemoveCoverPhoto] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("tripId", trip.id);
        formData.set("coverEmoji", emoji);
        if (removeCoverPhoto) formData.set("removeCoverPhoto", "1");
        await updateTrip(formData);
        onDone();
      }}
      className="space-y-2.5"
    >
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
      <input name="title" defaultValue={trip.title} className="input-field" required />
      <input name="destination" defaultValue={trip.destination ?? ""} placeholder="Destination (optional)" className="input-field" />
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="date"
          name="startDate"
          defaultValue={trip.start_date}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-field"
          required
        />
        <input type="date" name="endDate" defaultValue={trip.end_date} min={startDate} className="input-field" />
      </div>
      <textarea name="notes" defaultValue={trip.notes ?? ""} placeholder="Notes (optional)" className="input-field" rows={2} />
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">
          Page theme — auto-picked from the destination
        </label>
        <select name="theme" defaultValue={trip.theme ?? ""} className="input-field text-sm">
          <option value="">auto ({resolveTripTheme(trip).label})</option>
          {THEME_OPTIONS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">
          Cover photo — themes this page
        </label>
        {trip.cover_photo_url && !removeCoverPhoto ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-soft">has a cover photo</span>
            <button type="button" onClick={() => setRemoveCoverPhoto(true)} className="text-accent underline underline-offset-2">
              remove
            </button>
          </div>
        ) : (
          <input type="file" name="coverPhoto" accept="image/*" className="input-field !py-2 text-xs" />
        )}
      </div>
      <div className="flex gap-2">
        <SubmitButton label="save changes" pendingLabel="Saving…" />
        <button type="button" onClick={onDone} className="btn-ghost !py-1.5 !px-3 text-xs">
          cancel
        </button>
      </div>
    </form>
  );
}

function ConvertToMemoryForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("tripId", trip.id);
        await convertTripToMemory(formData);
        onDone();
      }}
      className="space-y-2.5"
    >
      <p className="text-sm text-ink-soft">Wrap up &ldquo;{trip.title}&rdquo; as a memory to keep forever.</p>
      <input name="title" defaultValue={trip.title} className="input-field" placeholder="Title" />
      <textarea name="story" defaultValue={trip.notes ?? ""} placeholder="Tell the story…" className="input-field" rows={3} />
      <div className="grid grid-cols-2 gap-2.5">
        <input name="location" defaultValue={trip.destination ?? ""} placeholder="Location" className="input-field" />
        <input name="tags" placeholder="tags, comma, separated" className="input-field" />
      </div>
      <input type="file" name="photos" accept="image/*,video/*" multiple className="input-field !py-2 text-xs" />
      <div className="flex gap-2">
        <SubmitButton label="save as memory" pendingLabel="Saving…" />
        <button type="button" onClick={onDone} className="btn-ghost !py-1.5 !px-3 text-xs">
          cancel
        </button>
      </div>
    </form>
  );
}

function TripHeader({ trip }: { trip: Trip }) {
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const state = getTripState(trip);
  const days = tripDurationDays(trip);

  const hasPhoto = Boolean(trip.cover_photo_url);
  const router = useRouter();
  const [painting, setPainting] = useState(false);
  const autoTried = useRef(false);

  async function paintBanner(force: boolean) {
    setPainting(true);
    try {
      await fetch("/api/trips/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: trip.id, force }),
      });
      router.refresh();
    } catch {
      // ignore - the button stays available to retry
    } finally {
      setPainting(false);
    }
  }

  // Trips without any cover get a Higgsfield banner for their destination automatically.
  useEffect(() => {
    if (!hasPhoto && !autoTried.current) {
      autoTried.current = true;
      paintBanner(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPhoto]);

  return (
    <div className="card-panel p-0 mb-5 overflow-hidden">
      <div
        className={`p-5 ${hasPhoto && !editing && !converting ? "min-h-[230px] flex flex-col justify-end" : ""}`}
        style={{
          background: hasPhoto
            ? `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.05) 70%), ${tripThemeBackground(trip)}`
            : tripThemeBackground(trip),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
      {editing ? (
        <div className={hasPhoto ? "bg-white/90 dark:bg-black/70 rounded-xl p-3 -m-3" : ""}>
          <EditTripForm trip={trip} onDone={() => setEditing(false)} />
        </div>
      ) : converting ? (
        <div className={hasPhoto ? "bg-white/90 dark:bg-black/70 rounded-xl p-3 -m-3" : ""}>
          <ConvertToMemoryForm trip={trip} onDone={() => setConverting(false)} />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span className="text-4xl leading-none">{trip.cover_emoji}</span>
            <div className={`flex-1 min-w-0 ${hasPhoto ? "drop-shadow" : ""}`}>
              <p className={`font-hand text-3xl leading-tight ${hasPhoto ? "text-white" : ""}`}>{trip.title}</p>
              {trip.destination && (
                <p className={`text-sm mt-0.5 ${hasPhoto ? "text-white/90" : "text-ink-soft"}`}>📍 {trip.destination}</p>
              )}
              <p className={`text-[11px] mt-1 ${hasPhoto ? "text-white/80" : "text-ink-soft"}`}>
                {formatDateRange(trip.start_date, trip.end_date)} · {days} day{days === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className={`chip text-[10px] !py-0.5 !px-2 ${STATE_CHIP[state]}`}>{STATE_LABEL[state]}</span>
                {trip.memory_id && (
                  <Link
                    href={`/memories?open=${trip.memory_id}`}
                    className={`text-xs underline underline-offset-2 ${hasPhoto ? "text-white" : "text-accent"}`}
                  >
                    ♥ view memory
                  </Link>
                )}
              </div>
              {trip.notes && (
                <p className={`text-sm mt-2 whitespace-pre-line ${hasPhoto ? "text-white/90" : "text-ink-soft"}`}>
                  {trip.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setEditing(true)} className="btn-ghost !py-1.5 !px-3 text-xs">
              edit
            </button>
            <button
              disabled={painting}
              onClick={() => paintBanner(true)}
              className="btn-ghost !py-1.5 !px-3 text-xs"
              title="Paint a fresh banner for this destination"
            >
              {painting ? "painting banner…" : "✨ new banner"}
            </button>
            {state === "completed" && !trip.memory_id && (
              <button onClick={() => setConverting(true)} className="btn-ghost !py-1.5 !px-3 text-xs text-accent">
                → wrap up as memory
              </button>
            )}
            <button
              disabled={pending}
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmingDelete(true);
                  return;
                }
                startTransition(() => deleteTrip(trip.id));
              }}
              className={`btn-ghost !py-1.5 !px-3 text-xs ml-auto ${confirmingDelete ? "text-accent" : ""}`}
            >
              {confirmingDelete ? "confirm delete?" : "delete trip"}
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

// ---------- Itinerary ----------

function AddItineraryForm({ tripId, dayKeys, onDone }: { tripId: string; dayKeys: string[]; onDone: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("tripId", tripId);
        formData.set("kind", "itinerary");
        await addTripItem(formData);
        formRef.current?.reset();
        onDone();
      }}
      className="flex flex-wrap items-center gap-2 mt-2"
    >
      <select name="dayDate" className="input-field !w-auto text-xs" required>
        {dayKeys.map((d) => (
          <option key={d} value={d}>
            {formatFriendlyDate(d)}
          </option>
        ))}
      </select>
      <input type="time" name="time" className="input-field !w-28 text-xs" />
      <input name="title" placeholder="What's happening?" className="input-field flex-1 min-w-[140px] text-xs" required />
      <SubmitButton label="add" pendingLabel="Adding…" />
    </form>
  );
}

function ItinerarySection({ tripId, items, dayKeys }: { tripId: string; items: TripItem[]; dayKeys: string[] }) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const itineraryItems = items.filter((i) => i.kind === "itinerary");

  const byDay = useMemo(() => {
    const map = new Map<string, TripItem[]>();
    for (const item of itineraryItems) {
      const key = item.day_date ?? dayKeys[0];
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    }
    return map;
  }, [itineraryItems, dayKeys]);

  return (
    <SectionCard title="Itinerary">
      {dayKeys.map((day) => {
        const dayItems = byDay.get(day) ?? [];
        return (
          <div key={day} className="mb-3 last:mb-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-1">{formatFriendlyDate(day)}</p>
            {dayItems.length === 0 ? (
              <p className="text-xs text-ink-soft italic">nothing planned yet</p>
            ) : (
              <div className="space-y-1">
                {dayItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      disabled={pending}
                      onChange={(e) => startTransition(() => toggleTripItem(item.id, tripId, e.target.checked))}
                      className="mt-1 accent-[var(--accent,#e8798a)] flex-shrink-0"
                      aria-label={`Mark ${item.title} done`}
                    />
                    {item.time && <span className="text-ink-soft text-xs w-14 flex-shrink-0">{item.time}</span>}
                    <span className={`flex-1 ${item.done ? "line-through text-ink-soft" : ""}`}>{item.title}</span>
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => deleteTripItem(item.id, tripId))}
                      className="text-[11px] text-accent underline underline-offset-2"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {adding ? (
        <AddItineraryForm tripId={tripId} dayKeys={dayKeys} onDone={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost !py-1 !px-2.5 text-[11px] text-accent mt-2">
          + add to itinerary
        </button>
      )}
    </SectionCard>
  );
}

// ---------- Transport & Stay (logistics) ----------

function AddLogisticsForm({
  tripId,
  kind,
  onDone,
}: {
  tripId: string;
  kind: "transport" | "stay";
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("tripId", tripId);
        formData.set("kind", kind);
        await addLogistics(formData);
        formRef.current?.reset();
        onDone();
      }}
      className="card-panel p-3 space-y-2 border-2 border-accent/30 mt-2"
    >
      {kind === "transport" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <select name="label" className="input-field text-xs" required defaultValue="Flight">
              {TRANSPORT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input name="bookingRef" placeholder="Booking ref (optional)" className="input-field text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="fromLocation" placeholder="From" className="input-field text-xs" />
            <input name="toLocation" placeholder="To" className="input-field text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" name="startDate" className="input-field text-xs" title="Departure date" />
            <input type="time" name="startTime" className="input-field text-xs" title="Departure time" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" name="endDate" className="input-field text-xs" title="Arrival date" />
            <input type="time" name="endTime" className="input-field text-xs" title="Arrival time" />
          </div>
        </>
      ) : (
        <>
          <input name="label" placeholder="Hotel / stay name" className="input-field text-xs" required />
          <input name="fromLocation" placeholder="Address (optional)" className="input-field text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" name="startDate" className="input-field text-xs" title="Check-in" />
            <input type="date" name="endDate" className="input-field text-xs" title="Check-out" />
          </div>
          <input name="bookingRef" placeholder="Booking ref (optional)" className="input-field text-xs" />
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input type="number" name="cost" step="0.01" min="0" placeholder="Cost ₹ (optional)" className="input-field text-xs" />
        <input name="notes" placeholder="Notes (optional)" className="input-field text-xs" />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">
          {kind === "transport" ? "Ticket" : "Booking confirmation"} (optional)
        </label>
        <input type="file" name="document" accept="image/*,.pdf" className="input-field !py-2 text-xs" />
      </div>
      <div className="flex gap-2">
        <SubmitButton label="add" pendingLabel="Adding…" />
        <button type="button" onClick={onDone} className="btn-ghost !py-1.5 !px-3 text-xs">
          cancel
        </button>
      </div>
    </form>
  );
}

function LogisticsSection({
  tripId,
  logistics,
  kind,
  title,
}: {
  tripId: string;
  logistics: TripLogistics[];
  kind: "transport" | "stay";
  title: string;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const items = logistics.filter((l) => l.kind === kind);

  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <p className="text-xs text-ink-soft italic">nothing added yet</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((l) => {
            const dateRange = l.start_date ? formatDateRange(l.start_date, l.end_date) : null;
            const timeRange = formatTimeRange(l.start_time, l.end_time);
            return (
              <div key={l.id} className="flex items-start gap-3 text-sm border-b last:border-0 border-black/[0.05] dark:border-white/5 pb-2 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {l.label}
                    {kind === "transport" && (l.from_location || l.to_location) && (
                      <span className="font-normal text-ink-soft">
                        {" "}
                        · {l.from_location ?? "?"} → {l.to_location ?? "?"}
                      </span>
                    )}
                  </p>
                  {kind === "stay" && l.from_location && <p className="text-[11px] text-ink-soft">{l.from_location}</p>}
                  {dateRange && <p className="text-[11px] text-ink-soft">{dateRange}{timeRange ? ` · ${timeRange}` : ""}</p>}
                  {l.booking_ref && <p className="text-[11px] text-ink-soft">ref: {l.booking_ref}</p>}
                  {l.notes && <p className="text-[11px] text-ink-soft italic">{l.notes}</p>}
                  {l.document_url && (
                    <a
                      href={l.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent underline underline-offset-2 inline-block mt-0.5"
                    >
                      📎 {kind === "transport" ? "view ticket" : "view confirmation"}
                    </a>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {l.cost != null && <p className="font-bold text-sm">{formatINR(l.cost)}</p>}
                  <button
                    disabled={pending}
                    onClick={() => startTransition(() => deleteLogistics(l.id, tripId))}
                    className="text-[11px] text-accent underline underline-offset-2"
                  >
                    remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {adding ? (
        <AddLogisticsForm tripId={tripId} kind={kind} onDone={() => setAdding(false)} />
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost !py-1 !px-2.5 text-[11px] text-accent mt-2">
          + add {kind === "transport" ? "transport" : "a stay"}
        </button>
      )}
    </SectionCard>
  );
}

// ---------- Packing & wishlist (checklists) ----------

function ChecklistSection({
  tripId,
  items,
  kind,
  title,
  placeholder,
  showCategory,
}: {
  tripId: string;
  items: TripItem[];
  kind: "packing" | "wishlist";
  title: string;
  placeholder: string;
  showCategory?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const list = items.filter((i) => i.kind === kind);
  const doneCount = list.filter((i) => i.done).length;

  return (
    <SectionCard title={`${title}${list.length > 0 ? ` (${doneCount}/${list.length})` : ""}`}>
      {list.length === 0 ? (
        <p className="text-xs text-ink-soft italic">nothing here yet</p>
      ) : (
        <div className="space-y-1.5">
          {list.map((item) => {
            const categoryMeta = showCategory ? WISHLIST_CATEGORIES.find((c) => c.key === item.category) : null;
            return (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(e) => startTransition(() => toggleTripItem(item.id, tripId, e.target.checked))}
                  className="w-4 h-4 accent-accent flex-shrink-0"
                />
                <span className={`flex-1 ${item.done ? "line-through text-ink-soft" : ""}`}>
                  {categoryMeta ? `${categoryMeta.emoji} ` : ""}
                  {item.title}
                </span>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => deleteTripItem(item.id, tripId))}
                  className="text-[11px] text-accent underline underline-offset-2 flex-shrink-0"
                >
                  remove
                </button>
              </label>
            );
          })}
        </div>
      )}
      {adding ? (
        <form
          ref={formRef}
          action={async (formData) => {
            formData.set("tripId", tripId);
            formData.set("kind", kind);
            await addTripItem(formData);
            formRef.current?.reset();
          }}
          className="flex flex-wrap items-center gap-2 mt-2"
        >
          {showCategory && (
            <select name="category" className="input-field !w-auto text-xs" defaultValue="other">
              {WISHLIST_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          )}
          <input name="title" placeholder={placeholder} className="input-field flex-1 min-w-[140px] text-xs" required />
          <SubmitButton label="add" pendingLabel="Adding…" />
          <button type="button" onClick={() => setAdding(false)} className="btn-ghost !py-1.5 !px-3 text-xs">
            done
          </button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost !py-1 !px-2.5 text-[11px] text-accent mt-2">
          + add
        </button>
      )}
    </SectionCard>
  );
}

// ---------- Expenses ----------

function TripExpensesSection({
  trip,
  expenses,
  names,
  cards,
  financeClosed,
  defaultPaidBy,
}: {
  trip: Trip;
  expenses: Expense[];
  names: { a: string; b: string };
  cards: CreditCard[];
  financeClosed: boolean;
  defaultPaidBy: "partner_a" | "partner_b";
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  // Once finances are closed the list folds away; open it only when needed.
  const [expanded, setExpanded] = useState(!financeClosed);
  const [deletePending, startDeleteTransition] = useTransition();
  const sorted = useMemo(
    () => [...expenses].sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1)),
    [expenses]
  );
  // Closing finances folds the list away automatically; reopening shows it again.
  useEffect(() => {
    setExpanded(!financeClosed);
  }, [financeClosed]);

  const stats = useMemo(() => {
    let total = 0;
    let byA = 0;
    let byB = 0;
    let sharedByA = 0;
    let sharedByB = 0;
    for (const e of expenses) {
      total += e.amount;
      if (e.paid_by === "partner_a") byA += e.amount;
      else byB += e.amount;
      if (e.is_shared) {
        if (e.paid_by === "partner_a") sharedByA += e.amount;
        else sharedByB += e.amount;
      }
    }
    const balance = (sharedByA - sharedByB) / 2;
    return { total, byA, byB, balance };
  }, [expenses]);

  return (
    <SectionCard title="Trip expenses">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Total spent</p>
          <p className="text-lg font-bold">{formatINR(stats.total)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Paid by each</p>
          <p className="text-xs">
            {names.a}: <span className="font-bold">{formatINR(stats.byA)}</span>
          </p>
          <p className="text-xs">
            {names.b}: <span className="font-bold">{formatINR(stats.byB)}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">For this trip</p>
          {Math.round(Math.abs(stats.balance) * 100) === 0 ? (
            <p className="text-xs text-ink-soft">even split</p>
          ) : (
            <p className="text-xs">
              {stats.balance > 0 ? names.b : names.a} owes {stats.balance > 0 ? names.a : names.b}{" "}
              <span className="font-bold text-accent">{formatINR(Math.abs(stats.balance))}</span>
            </p>
          )}
        </div>
      </div>

      {financeClosed && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="btn-ghost !py-1 !px-2.5 text-[11px] mb-2"
        >
          {expanded ? "▾ hide" : "▸ show"} all {expenses.length} expenses
        </button>
      )}

      {expanded &&
        (expenses.length === 0 ? (
          <p className="text-xs text-ink-soft italic">no expenses logged for this trip yet</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-ink-soft border-b border-black/10 dark:border-white/10">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Title</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2">Paid by</th>
                  <th className="py-2 px-2">Paid with</th>
                  <th className="py-2 px-2">Split</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => {
                  const meta = EXPENSE_CATEGORIES.find((c) => c.key === e.category) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
                  return (
                    <tr key={e.id} className="border-b last:border-0 border-black/[0.05] dark:border-white/5">
                      <td className="py-2 px-2 whitespace-nowrap text-ink-soft text-xs">{formatFriendlyDate(e.expense_date)}</td>
                      <td className="py-2 px-2">
                        <p className="font-semibold truncate max-w-[180px]">{e.title}</p>
                        {e.notes && <p className="text-[11px] text-ink-soft italic truncate max-w-[180px]">{e.notes}</p>}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs">
                        {meta.emoji} {meta.label}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs">{e.paid_by === "partner_a" ? names.a : names.b}</td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs">{paymentLabel(e, cards)}</td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs">{e.is_shared ? "split" : "personal"}</td>
                      <td className="py-2 px-2 whitespace-nowrap text-right font-bold">{formatINR(e.amount)}</td>
                      <td className="py-2 px-2 whitespace-nowrap text-right">
                        <button
                          onClick={() => setEditing(e)}
                          className="text-[11px] text-ink-soft underline underline-offset-2 mr-2.5"
                        >
                          edit
                        </button>
                        <button
                          disabled={deletePending}
                          onClick={() => startDeleteTransition(() => deleteExpense(e.id))}
                          className="text-[11px] text-accent underline underline-offset-2"
                        >
                          delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {adding ? (
        <div className="mt-3">
          <ExpenseForm
            names={names}
            trips={[trip]}
            cards={cards}
            defaultPaidBy={defaultPaidBy}
            defaultTripId={trip.id}
            onDone={() => setAdding(false)}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn-ghost !py-1 !px-2.5 text-[11px] text-accent mt-2">
          + add expense
        </button>
      )}
      <Link href="/expenses" className="block text-[11px] text-ink-soft underline underline-offset-2 mt-2">
        manage all expenses →
      </Link>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
            <ExpenseForm
              expense={editing}
              names={names}
              trips={[trip]}
              cards={cards}
              defaultPaidBy={editing.paid_by}
              onDone={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------- Memories & collage ----------

function TripMemoriesSection({ tripId, memories }: { tripId: string; memories: Memory[] }) {
  const [enlarged, setEnlarged] = useState<string | null>(null);

  return (
    <SectionCard title="Memories from this trip">
      {memories.length === 0 && (
        <p className="text-xs text-ink-soft italic mb-2">
          No memories yet — add one below with a few photos and the story, and it shows up right here.
        </p>
      )}

      <div className="space-y-5">
        {memories.map((m) => {
          const photos = m.photos ?? [];
          return (
            <div key={m.id} className="border-b last:border-0 border-black/[0.06] dark:border-white/10 pb-5 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {m.title && <p className="font-hand text-2xl leading-tight">{m.title}</p>}
                  <p className="text-[11px] text-ink-soft">
                    {m.location ? `📍 ${m.location} · ` : ""}
                    {formatFriendlyDate(m.memory_date)}
                  </p>
                </div>
                <Link
                  href={`/memories?open=${m.id}`}
                  className="text-[11px] text-accent underline underline-offset-2 flex-shrink-0"
                >
                  open / edit
                </Link>
              </div>
              {m.story && <p className="font-patrick text-lg leading-snug mt-2 whitespace-pre-wrap">{m.story}</p>}
              {photos.length > 0 && (
                <div className={`grid gap-1.5 mt-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {photos.map((url) => (
                    <button
                      key={url}
                      onClick={() => setEnlarged(url)}
                      className={`relative rounded-lg overflow-hidden ${photos.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
                    >
                      <Image src={url} alt={m.title ?? ""} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <AddMemoryForm fixedTripId={tripId} />
      </div>

      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setEnlarged(null)}
        >
          <div className="relative w-full h-full max-w-4xl">
            <Image src={enlarged} alt="" fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------- Page ----------

export default function TripDetailClient({
  trip,
  logistics,
  items,
  expenses,
  memories,
  cards,
  partnerNames,
}: {
  trip: Trip;
  logistics: TripLogistics[];
  items: TripItem[];
  expenses: Expense[];
  memories: Memory[];
  cards: CreditCard[];
  partnerNames: { a: string; b: string };
}) {
  const dayKeys = useMemo(() => tripDayKeys(trip), [trip]);
  const financeClosed = Boolean(trip.finance_closed_at);

  return (
    <div className="relative">
      <div className="relative z-10">
      <Link href="/trips" className="text-[11px] text-ink-soft underline underline-offset-2 mb-3 inline-block">
        ← all trips
      </Link>
      <TripHeader trip={trip} />
      <TripFinanceBar trip={trip} expenses={expenses} cards={cards} />
      <TripAnalysis expenses={expenses} cards={cards} names={partnerNames} dayCount={dayKeys.length} />
      <ItinerarySection tripId={trip.id} items={items} dayKeys={dayKeys} />
      <LogisticsSection tripId={trip.id} logistics={logistics} kind="transport" title="Transport" />
      <LogisticsSection tripId={trip.id} logistics={logistics} kind="stay" title="Stay" />
      <TripExpensesSection
        trip={trip}
        expenses={expenses}
        names={partnerNames}
        cards={cards}
        financeClosed={financeClosed}
        defaultPaidBy="partner_a"
      />
      <TripMemoriesSection tripId={trip.id} memories={memories} />
      <ChecklistSection tripId={trip.id} items={items} kind="packing" title="Packing list" placeholder="What to pack…" />
      </div>
    </div>
  );
}
