import type { CreditCard, Expense } from "./types";
import { PAYMENT_METHODS } from "./types";

/** Reward points (or cashback %) earned per Rs.100 on a category for this card. */
export function ratePer100(card: CreditCard, category: string): number {
  const rule = card.reward_rules?.[category];
  return typeof rule === "number" ? rule : card.reward_rate_general;
}

export function pointsFor(card: CreditCard, category: string, amount: number): number {
  return (amount * ratePer100(card, category)) / 100;
}

/** The active card with the best reward for this category (by rupee value per Rs.100), or null if none. */
export function bestCardFor(cards: CreditCard[], category: string): CreditCard | null {
  let best: CreditCard | null = null;
  let bestValue = -1;
  for (const c of cards) {
    if (!c.is_active) continue;
    const value = ratePer100(c, category) * c.point_value;
    if (value > bestValue) {
      best = c;
      bestValue = value;
    }
  }
  return best;
}

/** A single <select> value for an expense's payment: "card:<id>", a payment-method key, or "" if unrecorded. */
export function paymentChoiceValue(e: Pick<Expense, "payment_method" | "card_id">): string {
  if (e.payment_method === "credit_card" && e.card_id) return `card:${e.card_id}`;
  return e.payment_method && e.payment_method !== "credit_card" ? e.payment_method : "";
}

/** Inverse of paymentChoiceValue, for form submissions. */
export function parsePaymentChoice(raw: string): { payment_method: string | null; card_id: string | null } {
  if (raw.startsWith("card:")) return { payment_method: "credit_card", card_id: raw.slice(5) || null };
  if (PAYMENT_METHODS.some((m) => m.key === raw)) return { payment_method: raw, card_id: null };
  return { payment_method: null, card_id: null };
}

export function paymentLabel(e: Pick<Expense, "payment_method" | "card_id">, cards: CreditCard[]): string {
  if (e.payment_method === "credit_card") return cards.find((c) => c.id === e.card_id)?.name ?? "Credit card";
  return PAYMENT_METHODS.find((m) => m.key === e.payment_method)?.label ?? "Not recorded";
}
