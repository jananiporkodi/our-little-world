"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { Expense, PartnerAssignee } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { todayIST } from "@/lib/dates";
import { addExpense, updateExpense, deleteExpense } from "@/app/(app)/expenses/actions";

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function categoryMeta(key: string) {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary !py-2 !px-4 text-sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function ExpenseForm({
  expense,
  names,
  defaultPaidBy,
  onDone,
}: {
  expense?: Expense;
  names: { a: string; b: string };
  defaultPaidBy: "partner_a" | "partner_b";
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(expense);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        if (isEdit && expense) {
          formData.set("expenseId", expense.id);
          await updateExpense(formData);
        } else {
          await addExpense(formData);
          formRef.current?.reset();
        }
        onDone();
      }}
      className="card-panel p-4 space-y-2.5"
    >
      <p className="font-hand text-xl">{isEdit ? "Edit expense" : "Add an expense"}</p>
      <input name="title" defaultValue={expense?.title} placeholder="Groceries, dinner, cab…" className="input-field" required />
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="number"
          name="amount"
          defaultValue={expense?.amount}
          step="0.01"
          min="0"
          placeholder="Amount (₹)"
          className="input-field"
          required
        />
        <input type="date" name="expenseDate" defaultValue={expense?.expense_date ?? todayIST()} className="input-field" required />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <select name="category" defaultValue={expense?.category ?? "other"} className="input-field">
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <select name="paidBy" defaultValue={expense?.paid_by ?? defaultPaidBy} className="input-field">
          <option value="partner_a">Paid by {names.a}</option>
          <option value="partner_b">Paid by {names.b}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="isShared" defaultChecked={expense?.is_shared ?? true} className="w-4 h-4" />
        Split this equally between us
      </label>
      <input name="notes" defaultValue={expense?.notes ?? ""} placeholder="Notes (optional)" className="input-field" />
      <div className="flex gap-2 pt-1">
        <SubmitButton label={isEdit ? "save changes" : "add expense"} pendingLabel={isEdit ? "Saving…" : "Adding…"} />
        <button type="button" onClick={onDone} className="btn-ghost !py-2 !px-3 text-sm">
          cancel
        </button>
      </div>
    </form>
  );
}

function ExpenseRow({ expense, names }: { expense: Expense; names: { a: string; b: string } }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const meta = categoryMeta(expense.category);
  const payerName = expense.paid_by === "partner_a" ? names.a : names.b;

  if (editing) {
    return (
      <ExpenseForm expense={expense} names={names} defaultPaidBy={expense.paid_by} onDone={() => setEditing(false)} />
    );
  }

  return (
    <div className="card-panel p-3.5 flex items-center gap-3">
      <span className="text-xl flex-shrink-0">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink truncate">{expense.title}</p>
        <p className="text-[11px] text-ink-soft">
          {payerName} · {meta.label} {expense.is_shared ? "· split" : "· personal"}
        </p>
        {expense.notes && <p className="text-[11px] text-ink-soft italic mt-0.5">{expense.notes}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm">{formatINR(expense.amount)}</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={() => setEditing(true)} className="text-[11px] text-ink-soft underline underline-offset-2">
            edit
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => deleteExpense(expense.id))}
            className="text-[11px] text-accent underline underline-offset-2"
          >
            delete
          </button>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, emoji, amount, max }: { label: string; emoji: string; amount: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((amount / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>
          {emoji} {label}
        </span>
        <span className="font-bold">{formatINR(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-black/[0.05] dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ExpensesClient({
  expenses,
  partnerNames,
  currentPartner,
}: {
  expenses: Expense[];
  partnerNames: { a: string; b: string };
  currentPartner: PartnerAssignee | null;
}) {
  const [adding, setAdding] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>("all");

  const defaultPaidBy: "partner_a" | "partner_b" =
    currentPartner === "partner_a" || currentPartner === "partner_b" ? currentPartner : "partner_a";

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => e.expense_date.slice(0, 7)));
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [expenses]);

  const filtered = useMemo(
    () => (monthFilter === "all" ? expenses : expenses.filter((e) => e.expense_date.slice(0, 7) === monthFilter)),
    [expenses, monthFilter]
  );

  const stats = useMemo(() => {
    let total = 0;
    let sharedByA = 0;
    let sharedByB = 0;
    let totalByA = 0;
    let totalByB = 0;
    const byCategory = new Map<string, number>();

    for (const e of filtered) {
      total += e.amount;
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
      if (e.paid_by === "partner_a") totalByA += e.amount;
      else totalByB += e.amount;
      if (e.is_shared) {
        if (e.paid_by === "partner_a") sharedByA += e.amount;
        else sharedByB += e.amount;
      }
    }

    const balance = (sharedByA - sharedByB) / 2; // positive: B owes A; negative: A owes B
    const categories = Array.from(byCategory.entries())
      .map(([key, amount]) => ({ key, amount }))
      .sort((a, b) => b.amount - a.amount);
    const maxCategory = categories[0]?.amount ?? 0;

    return { total, totalByA, totalByB, balance, categories, maxCategory };
  }, [filtered]);

  return (
    <div>
      <p className="font-hand text-4xl md:text-5xl leading-none mb-1">Our expenses 💰</p>
      <p className="text-sm text-ink-soft mb-5">what we&apos;ve spent, split fairly</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="input-field !w-auto text-sm">
          <option value="all">All time</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm">
          + add expense
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <ExpenseForm names={partnerNames} defaultPaidBy={defaultPaidBy} onDone={() => setAdding(false)} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="card-panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">
            {monthFilter === "all" ? "Total spent" : "Spent this month"}
          </p>
          <p className="text-2xl font-bold">{formatINR(stats.total)}</p>
        </div>
        <div className="card-panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">Paid by each</p>
          <p className="text-sm">
            {partnerNames.a}: <span className="font-bold">{formatINR(stats.totalByA)}</span>
          </p>
          <p className="text-sm">
            {partnerNames.b}: <span className="font-bold">{formatINR(stats.totalByB)}</span>
          </p>
        </div>
        <div className="card-panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft mb-1">Split balance</p>
          {Math.round(Math.abs(stats.balance) * 100) === 0 ? (
            <p className="text-sm font-bold text-ink-soft">all settled up 🎉</p>
          ) : stats.balance > 0 ? (
            <p className="text-sm">
              {partnerNames.b} owes {partnerNames.a}{" "}
              <span className="font-bold text-accent">{formatINR(stats.balance)}</span>
            </p>
          ) : (
            <p className="text-sm">
              {partnerNames.a} owes {partnerNames.b}{" "}
              <span className="font-bold text-accent">{formatINR(Math.abs(stats.balance))}</span>
            </p>
          )}
        </div>
      </div>

      {stats.categories.length > 0 && (
        <div className="card-panel p-5 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-3">By category</p>
          <div className="space-y-2.5">
            {stats.categories.map((c) => {
              const meta = categoryMeta(c.key);
              return <BarRow key={c.key} label={meta.label} emoji={meta.emoji} amount={c.amount} max={stats.maxCategory} />;
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft mb-2">
        {monthFilter === "all" ? "All expenses" : monthLabel(monthFilter)}
      </p>
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">No expenses logged yet.</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => (
            <ExpenseRow key={e.id} expense={e} names={partnerNames} />
          ))}
        </div>
      )}
    </div>
  );
}
