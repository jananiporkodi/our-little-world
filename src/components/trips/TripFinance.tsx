"use client";

import { useMemo, useState, useTransition } from "react";
import type { CreditCard, Expense, Trip } from "@/lib/types";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { bestCardFor, paymentLabel, pointsFor } from "@/lib/cards";
import { formatFriendlyDate } from "@/lib/dates";
import { closeTripFinance, reopenTripFinance, tagUntaggedTripExpenses } from "@/app/(app)/trips/actions";

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function categoryMeta(key: string) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

const PALETTE = ["#f4a58a", "#e8798a", "#b9a3e3", "#7fc8b2", "#f2c66d", "#7fb5e8", "#e59ac7", "#a8c97f"];

/** Close / reopen the trip's finances, plus a one-tap way to tag everything not yet recorded. */
export function TripFinanceBar({ trip, expenses, cards }: { trip: Trip; expenses: Expense[]; cards: CreditCard[] }) {
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState("upi");
  const closed = Boolean(trip.finance_closed_at);
  const untagged = expenses.filter((e) => !e.payment_method);
  const untaggedTotal = untagged.reduce((s, e) => s + e.amount, 0);

  return (
    <div
      className={`card-panel p-4 mb-5 ${closed ? "border-2 border-green-500/40 bg-green-50/60 dark:bg-green-900/10" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="font-hand text-xl">
            {closed ? "Finances closed ✓" : "Trip finances"}
          </p>
          <p className="text-[11px] text-ink-soft">
            {closed
              ? `Wrapped up on ${formatFriendlyDate(trip.finance_closed_at!.slice(0, 10))}. You'll see a warning if you edit a closed trip's expenses.`
              : "When the trip is over and everything's logged, mark the money side as complete."}
          </p>
        </div>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(() => (closed ? reopenTripFinance(trip.id) : closeTripFinance(trip.id)))
          }
          className={closed ? "btn-ghost !py-1.5 !px-3 text-xs" : "btn-primary !py-1.5 !px-3 text-xs"}
        >
          {pending ? "…" : closed ? "reopen" : "close finances"}
        </button>
      </div>

      {untagged.length > 0 && (
        <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-soft">
            {untagged.length} expense{untagged.length === 1 ? "" : "s"} ({formatINR(untaggedTotal)}) with no payment method —
            mark all as
          </span>
          <select value={choice} onChange={(e) => setChoice(e.target.value)} className="input-field !w-auto !py-1 text-xs">
            {cards
              .filter((c) => c.is_active)
              .map((c) => (
                <option key={c.id} value={`card:${c.id}`}>
                  💳 {c.name}
                </option>
              ))}
            {PAYMENT_METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
          <button
            disabled={pending}
            onClick={() => startTransition(() => tagUntaggedTripExpenses(trip.id, choice))}
            className="btn-ghost !py-1 !px-2.5 text-[11px] text-accent"
          >
            apply
          </button>
        </div>
      )}
    </div>
  );
}

/** A playful look at where the trip's money went, how it was paid, and which card points were won or lost. */
export function TripAnalysis({
  expenses,
  cards,
  names,
  dayCount,
}: {
  expenses: Expense[];
  cards: CreditCard[];
  names: { a: string; b: string };
  dayCount: number;
}) {
  const [showAllMethods, setShowAllMethods] = useState(false);

  const a = useMemo(() => {
    let total = 0;
    const byCategory = new Map<string, number>();
    const byMethod = new Map<string, number>();
    const byDay = new Map<string, number>();
    const byPerson = { partner_a: 0, partner_b: 0 };
    let earnedPoints = 0;
    let earnedValue = 0;
    let missedPoints = 0;
    let missedValue = 0;
    let untaggedTotal = 0;
    const leaks = new Map<string, { amount: number; points: number; value: number; cardName: string }>();

    for (const e of expenses) {
      total += e.amount;
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      const method = paymentLabel(e, cards);
      byMethod.set(method, (byMethod.get(method) ?? 0) + e.amount);
      byDay.set(e.expense_date, (byDay.get(e.expense_date) ?? 0) + e.amount);
      byPerson[e.paid_by] += e.amount;

      if (e.payment_method === "credit_card") {
        const card = cards.find((c) => c.id === e.card_id);
        if (card) {
          const pts = pointsFor(card, e.category, e.amount);
          earnedPoints += pts;
          earnedValue += pts * card.point_value;
        }
      } else if (!e.payment_method) {
        untaggedTotal += e.amount;
      } else {
        const best = bestCardFor(cards, e.category);
        if (best) {
          const pts = pointsFor(best, e.category, e.amount);
          const value = pts * best.point_value;
          missedPoints += pts;
          missedValue += value;
          const row = leaks.get(e.category) ?? { amount: 0, points: 0, value: 0, cardName: best.name };
          row.amount += e.amount;
          row.points += pts;
          row.value += value;
          leaks.set(e.category, row);
        }
      }
    }

    const categories = Array.from(byCategory.entries())
      .map(([key, amount]) => ({ key, amount }))
      .sort((x, y) => y.amount - x.amount);
    const methods = Array.from(byMethod.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((x, y) => y.amount - x.amount);
    const leakRows = Array.from(leaks.entries())
      .map(([key, v]) => ({ key, ...v }))
      .filter((r) => r.points >= 0.5)
      .sort((x, y) => y.value - x.value);
    const top = [...expenses].sort((x, y) => y.amount - x.amount).slice(0, 5);
    const priciestDay = Array.from(byDay.entries()).sort((x, y) => y[1] - x[1])[0] ?? null;
    const smallest = [...expenses].sort((x, y) => x.amount - y.amount)[0] ?? null;

    return {
      total,
      categories,
      methods,
      byPerson,
      earnedPoints,
      earnedValue,
      missedPoints,
      missedValue,
      untaggedTotal,
      leakRows,
      top,
      priciestDay,
      smallest,
    };
  }, [expenses, cards]);

  if (expenses.length === 0) {
    return (
      <div className="card-panel p-4 mb-5 text-center">
        <p className="text-3xl mb-1">🪙</p>
        <p className="font-hand text-xl mb-1">Spend story</p>
        <p className="text-xs text-ink-soft italic">Add some trip expenses and the fun breakdown shows up here.</p>
      </div>
    );
  }

  const perDay = a.total / Math.max(1, dayCount);
  const hasCards = cards.some((c) => c.is_active);
  const topCat = a.categories[0];
  const topMeta = topCat ? categoryMeta(topCat.key) : null;
  const toppedBy = a.byPerson.partner_a >= a.byPerson.partner_b ? names.a : names.b;
  const toppedAmount = Math.max(a.byPerson.partner_a, a.byPerson.partner_b);
  const bigSpender = a.top[0];

  // Donut via a conic-gradient: each category gets a slice of the ring.
  let acc = 0;
  const stops = a.categories.map((c, i) => {
    const start = (acc / a.total) * 100;
    acc += c.amount;
    const end = (acc / a.total) * 100;
    return `${PALETTE[i % PALETTE.length]} ${start}% ${end}%`;
  });
  const donut = `conic-gradient(${stops.join(", ")})`;

  const methodList = showAllMethods ? a.methods : a.methods.slice(0, 4);

  return (
    <div className="mb-5 space-y-3">
      {/* Hero: the big number */}
      <div
        className="rounded-2xl p-4 text-center shadow-sm"
        style={{ background: "linear-gradient(135deg, #ffe3d6 0%, #fbd3e0 50%, #e4d8fb 100%)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">our trip cost</p>
        <p className="font-hand text-5xl leading-none my-1 text-ink">{formatINR(a.total)}</p>
        <p className="text-xs text-ink-soft">
          that&apos;s about {formatINR(perDay)} a day across {dayCount} day{dayCount === 1 ? "" : "s"} ✨
        </p>
      </div>

      {/* Donut + category tiles */}
      <div className="card-panel p-4">
        <p className="font-hand text-xl mb-3">Where the money went 🍩</p>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-36 h-36 flex-shrink-0">
            <div className="w-full h-full rounded-full" style={{ background: donut }} />
            <div className="absolute inset-4 rounded-full bg-white dark:bg-neutral-900 flex flex-col items-center justify-center">
              <span className="text-2xl leading-none">{topMeta?.emoji}</span>
              <span className="text-[10px] text-ink-soft mt-1">top: {topMeta?.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1 w-full">
            {a.categories.map((c, i) => {
              const m = categoryMeta(c.key);
              const share = Math.round((c.amount / a.total) * 100);
              return (
                <div
                  key={c.key}
                  className="rounded-xl p-2.5 border-l-4 bg-black/[0.025] dark:bg-white/5"
                  style={{ borderColor: PALETTE[i % PALETTE.length] }}
                >
                  <p className="text-lg leading-none">{m.emoji}</p>
                  <p className="text-[11px] text-ink-soft mt-1">{m.label}</p>
                  <p className="text-sm font-bold">
                    {formatINR(c.amount)} <span className="text-[10px] font-normal text-ink-soft">· {share}%</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Superlatives */}
      <div className="grid grid-cols-2 gap-2.5">
        {bigSpender && (
          <div className="rounded-2xl p-3 bg-peach/40">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">🏆 biggest splurge</p>
            <p className="text-sm font-bold truncate">{bigSpender.title}</p>
            <p className="text-xs text-ink-soft">{formatINR(bigSpender.amount)}</p>
          </div>
        )}
        {a.priciestDay && (
          <div className="rounded-2xl p-3 bg-blush/50">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">🔥 priciest day</p>
            <p className="text-sm font-bold">{formatFriendlyDate(a.priciestDay[0])}</p>
            <p className="text-xs text-ink-soft">{formatINR(a.priciestDay[1])}</p>
          </div>
        )}
        <div className="rounded-2xl p-3 bg-lavender/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">💸 chief spender</p>
          <p className="text-sm font-bold">{toppedBy}</p>
          <p className="text-xs text-ink-soft">paid {formatINR(toppedAmount)}</p>
        </div>
        {a.smallest && (
          <div className="rounded-2xl p-3 bg-black/[0.04] dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">🪙 tiniest buy</p>
            <p className="text-sm font-bold truncate">{a.smallest.title}</p>
            <p className="text-xs text-ink-soft">{formatINR(a.smallest.amount)}</p>
          </div>
        )}
      </div>

      {/* How it was paid, as chips */}
      <div className="card-panel p-4">
        <p className="font-hand text-xl mb-2">How we paid 💳</p>
        <div className="flex flex-wrap gap-2">
          {methodList.map((m, i) => (
            <span
              key={m.label}
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: `${PALETTE[(i + 2) % PALETTE.length]}33` }}
            >
              {m.label} · {formatINR(m.amount)}
            </span>
          ))}
          {a.methods.length > 4 && (
            <button onClick={() => setShowAllMethods((v) => !v)} className="text-[11px] text-accent underline">
              {showAllMethods ? "less" : `+${a.methods.length - 4} more`}
            </button>
          )}
        </div>
      </div>

      {/* Treasure chest of points */}
      {hasCards && (
        <div
          className="rounded-2xl p-4 border border-amber-300/50"
          style={{ background: "linear-gradient(135deg, #fff4d6 0%, #ffe8c2 100%)" }}
        >
          <p className="font-hand text-xl mb-2 text-ink">Reward treasure 🧰</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="rounded-xl bg-white/70 p-3 text-center">
              <p className="text-2xl">🪙</p>
              <p className="text-xl font-bold">{Math.round(a.earnedPoints).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-ink-soft">points won · ≈ {formatINR(a.earnedValue)}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3 text-center">
              <p className="text-2xl">🕳️</p>
              <p className="text-xl font-bold text-accent">{Math.round(a.missedPoints).toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-ink-soft">points that slipped away · ≈ {formatINR(a.missedValue)}</p>
            </div>
          </div>
          {a.leakRows.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-[11px] font-semibold text-ink">Oops, next time use the card for:</p>
              {a.leakRows.map((r) => {
                const m = categoryMeta(r.key);
                return (
                  <div key={r.key} className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs">
                    <span className="text-lg">{m.emoji}</span>
                    <span className="flex-1">
                      {m.label}: {formatINR(r.amount)} off-card → <b>+{Math.round(r.points)} pts</b> on {r.cardName}
                    </span>
                    <span className="font-bold text-accent flex-shrink-0">≈ {formatINR(r.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {a.untaggedTotal > 0 && (
            <p className="text-[11px] text-ink-soft mt-2">
              {formatINR(a.untaggedTotal)} has no payment method recorded, so it&apos;s left out of the points math.
            </p>
          )}
          <p className="text-[10px] text-ink-soft mt-2">
            Estimates from the reward rules saved on your card; point value and exclusions may differ on your statement.
          </p>
        </div>
      )}

      {/* Top 5 podium */}
      <div className="card-panel p-4">
        <p className="font-hand text-xl mb-2">Top 5 splurges 🛍️</p>
        <div className="space-y-1.5">
          {a.top.map((e, i) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-center">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
              <span className="flex-1 truncate">
                {categoryMeta(e.category).emoji} {e.title}
              </span>
              <span className="font-bold flex-shrink-0">{formatINR(e.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
