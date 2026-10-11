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

function Bar({ label, amount, max, total }: { label: string; amount: number; max: number; total: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((amount / max) * 100)) : 0;
  const share = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-bold">
          {formatINR(amount)} <span className="font-normal text-ink-soft">· {share}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/[0.05] dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

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

/** Where the trip's money went, how it was paid, and what card points were earned vs. missed. */
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
  const a = useMemo(() => {
    let total = 0;
    const byCategory = new Map<string, number>();
    const byMethod = new Map<string, number>();
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

    return { total, categories, methods, byPerson, earnedPoints, earnedValue, missedPoints, missedValue, untaggedTotal, leakRows, top };
  }, [expenses, cards]);

  if (expenses.length === 0) {
    return (
      <div className="card-panel p-4 mb-5">
        <p className="font-hand text-xl mb-1">Spend analysis</p>
        <p className="text-xs text-ink-soft italic">Add some trip expenses and the breakdown shows up here.</p>
      </div>
    );
  }

  const perDay = a.total / Math.max(1, dayCount);
  const maxCat = a.categories[0]?.amount ?? 0;
  const maxMethod = a.methods[0]?.amount ?? 0;
  const hasCards = cards.some((c) => c.is_active);

  return (
    <div className="card-panel p-4 mb-5">
      <p className="font-hand text-xl mb-3">Spend analysis</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Total</p>
          <p className="text-lg font-bold">{formatINR(a.total)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Per day</p>
          <p className="text-lg font-bold">{formatINR(perDay)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Paid by {names.a}</p>
          <p className="text-lg font-bold">{formatINR(a.byPerson.partner_a)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Paid by {names.b}</p>
          <p className="text-lg font-bold">{formatINR(a.byPerson.partner_b)}</p>
        </div>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">By category</p>
      <div className="space-y-2 mb-4">
        {a.categories.map((c) => {
          const m = categoryMeta(c.key);
          return <Bar key={c.key} label={`${m.emoji} ${m.label}`} amount={c.amount} max={maxCat} total={a.total} />;
        })}
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">How it was paid</p>
      <div className="space-y-2 mb-4">
        {a.methods.map((m) => (
          <Bar key={m.label} label={m.label} amount={m.amount} max={maxMethod} total={a.total} />
        ))}
      </div>

      {hasCards && (
        <div className="rounded-xl bg-peach/40 p-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">Card points</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-[10px] text-ink-soft">Earned on card</p>
              <p className="text-lg font-bold">{Math.round(a.earnedPoints).toLocaleString("en-IN")} pts</p>
              <p className="text-[11px] text-ink-soft">≈ {formatINR(a.earnedValue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-soft">Missed (paid by debit / UPI / cash)</p>
              <p className="text-lg font-bold text-accent">{Math.round(a.missedPoints).toLocaleString("en-IN")} pts</p>
              <p className="text-[11px] text-ink-soft">≈ {formatINR(a.missedValue)}</p>
            </div>
          </div>
          {a.leakRows.length > 0 && (
            <div className="space-y-1 mt-2">
              <p className="text-[11px] font-semibold">Where the leaks were</p>
              {a.leakRows.map((r) => {
                const m = categoryMeta(r.key);
                return (
                  <p key={r.key} className="text-xs">
                    {m.emoji} {m.label}: {formatINR(r.amount)} not on a card → +{Math.round(r.points)} pts on {r.cardName} (≈{" "}
                    {formatINR(r.value)})
                  </p>
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

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">Biggest expenses</p>
      <div className="space-y-1">
        {a.top.map((e) => (
          <div key={e.id} className="flex justify-between text-xs">
            <span className="truncate">
              {categoryMeta(e.category).emoji} {e.title}
            </span>
            <span className="font-bold flex-shrink-0 ml-2">{formatINR(e.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
