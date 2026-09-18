"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getActorName, notifyOtherPartner } from "@/lib/push";
import { PARTNER_COOKIE_NAME, isValidPartnerId } from "@/lib/auth";
import { todayIST } from "@/lib/dates";
import { getMemories, getNotes } from "@/lib/data";
import { REACTION_TYPES, type ReactionType } from "@/lib/reactions";

/**
 * An instant, no-typing-required nudge to the other partner's phone - kiss, hug, miss-you,
 * or high-five. Every send is logged (sender, receiver, type) so both partners can see a
 * running sent/received count per reaction, not just a one-off "sent!" toast.
 */
export async function sendReaction(type: ReactionType): Promise<{ sent: boolean }> {
  const actor = cookies().get(PARTNER_COOKIE_NAME)?.value;
  if (!isValidPartnerId(actor)) return { sent: false };

  const meta = REACTION_TYPES.find((r) => r.key === type);
  if (!meta) return { sent: false };

  const receiver = actor === "partner_a" ? "partner_b" : "partner_a";
  const supabase = getSupabaseServerClient();
  await supabase.from("kisses").insert({ sender_id: actor, receiver_id: receiver, type });

  const actorName = await getActorName();
  await notifyOtherPartner({ title: meta.notifyTitle(actorName), body: meta.notifyBody, url: "/" });
  revalidatePath("/", "layout");
  return { sent: true };
}

/** Sets (or replaces) the current partner's mood for today - one entry per partner per day. */
export async function setTodayMood(mood: string): Promise<{ ok: boolean }> {
  const actor = cookies().get(PARTNER_COOKIE_NAME)?.value;
  const trimmed = mood.trim();
  if (!isValidPartnerId(actor) || !trimmed) return { ok: false };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("daily_moods")
    .upsert({ partner_id: actor, mood: trimmed, mood_date: todayIST() }, { onConflict: "partner_id,mood_date" });
  if (error) throw error;

  revalidatePath("/", "layout");
  return { ok: true };
}

/** A genuinely random memory + note combo, for the "surprise me" button - deliberately not deterministic like the daily "memory of the day". */
export async function getSurprise() {
  const [memories, notes] = await Promise.all([getMemories(), getNotes()]);
  const memory = memories.length > 0 ? memories[Math.floor(Math.random() * memories.length)] : null;
  const note = notes.length > 0 ? notes[Math.floor(Math.random() * notes.length)] : null;

  return {
    memory: memory
      ? {
          id: memory.id,
          title: memory.title,
          story: memory.story,
          photo: memory.photos?.[0] ?? null,
          date: memory.memory_date,
        }
      : null,
    note: note ? { body: note.body, author: note.author } : null,
  };
}
