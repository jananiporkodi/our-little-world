"use client";

import type { CreditCard } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";

/** Picks how an expense was paid. Value is "card:<id>", a payment-method key, or "" (not recorded). */
export default function PaymentSelect({
  cards,
  defaultValue = "",
  className = "input-field !w-auto",
}: {
  cards: CreditCard[];
  defaultValue?: string;
  className?: string;
}) {
  return (
    <select name="payment" defaultValue={defaultValue} className={className} title="Paid with">
      <option value="">paid with…</option>
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
  );
}
