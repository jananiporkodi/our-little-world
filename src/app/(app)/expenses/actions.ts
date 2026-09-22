"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notifyOtherPartner, getActorName } from "@/lib/push";
import { todayIST } from "@/lib/dates";

function isPartner(value: string): value is "partner_a" | "partner_b" {
  return value === "partner_a" || value === "partner_b";
}

export async function addExpense(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const category = String(formData.get("category") ?? "").trim() || "other";
  const paidBy = String(formData.get("paidBy") ?? "").trim();
  const isShared = formData.get("isShared") === "on";
  const expenseDate = String(formData.get("expenseDate") ?? "").trim() || todayIST();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title || !amount || Number.isNaN(amount) || amount <= 0 || !isPartner(paidBy)) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("expenses").insert({
    title,
    amount,
    category,
    paid_by: paidBy,
    is_shared: isShared,
    expense_date: expenseDate,
    notes,
  });
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/", "layout");

  const actorName = await getActorName();
  await notifyOtherPartner({
    title: `${actorName} added an expense`,
    body: `${title} · ₹${amount.toLocaleString("en-IN")}`,
    url: "/expenses",
  });
}

/** Only the fields explicitly provided are changed - not currently used for partial updates, but keeps the door open. */
export async function updateExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "").trim();
  if (!expenseId) return;

  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const category = String(formData.get("category") ?? "").trim() || "other";
  const paidBy = String(formData.get("paidBy") ?? "").trim();
  const isShared = formData.get("isShared") === "on";
  const expenseDate = String(formData.get("expenseDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title || !amount || Number.isNaN(amount) || amount <= 0 || !isPartner(paidBy) || !expenseDate) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("expenses")
    .update({
      title,
      amount,
      category,
      paid_by: paidBy,
      is_shared: isShared,
      expense_date: expenseDate,
      notes,
    })
    .eq("id", expenseId);
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/", "layout");
}

export async function deleteExpense(expenseId: string) {
  if (!expenseId) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/", "layout");
}

/** Records a direct payment from the partner who owes to the partner who's owed, clearing that much of the running split balance. */
export async function addSettlement(formData: FormData) {
  const paidBy = String(formData.get("paidBy") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "").trim());
  const settlementDate = String(formData.get("settlementDate") ?? "").trim() || todayIST();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!isPartner(paidBy) || !amount || Number.isNaN(amount) || amount <= 0) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("settlements").insert({
    paid_by: paidBy,
    amount,
    settlement_date: settlementDate,
    note,
  });
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/", "layout");

  const actorName = await getActorName();
  await notifyOtherPartner({
    title: `${actorName} marked a payment as settled`,
    body: `₹${amount.toLocaleString("en-IN")}${note ? ` · ${note}` : ""}`,
    url: "/expenses",
  });
}

export async function deleteSettlement(settlementId: string) {
  if (!settlementId) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("settlements").delete().eq("id", settlementId);
  if (error) throw error;

  revalidatePath("/expenses");
  revalidatePath("/", "layout");
}
