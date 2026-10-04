"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadManyMediaFiles, uploadMediaFile } from "@/lib/storage";
import { notifyOtherPartner, getActorName } from "@/lib/push";
import type { TripLogisticsKind, TripItemKind } from "@/lib/types";

export async function addTrip(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();
  const endDate = endDateRaw && endDateRaw >= startDate ? endDateRaw : startDate;
  const coverEmoji = String(formData.get("coverEmoji") ?? "").trim() || "🧳";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coverPhoto = formData.get("coverPhoto") as File | null;

  if (!title || !startDate) return;

  const coverPhotoUrl =
    coverPhoto && coverPhoto.size > 0 ? await uploadMediaFile("reference-photos", coverPhoto, "trip-covers") : null;

  const supabase = getSupabaseServerClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      title,
      destination,
      start_date: startDate,
      end_date: endDate,
      cover_emoji: coverEmoji,
      notes,
      cover_photo_url: coverPhotoUrl,
    })
    .select()
    .single();
  if (error) throw error;

  revalidatePath("/trips");
  revalidatePath("/", "layout");

  const actorName = await getActorName();
  await notifyOtherPartner({
    title: `${actorName} is planning a trip`,
    body: title,
    url: `/trips/${trip.id}`,
  });

  return trip.id as string;
}

export async function updateTrip(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "").trim();
  if (!tripId) return;

  const title = String(formData.get("title") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim() || null;
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();
  const endDate = endDateRaw && endDateRaw >= startDate ? endDateRaw : startDate;
  const coverEmoji = String(formData.get("coverEmoji") ?? "").trim() || "🧳";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coverPhoto = formData.get("coverPhoto") as File | null;
  const removeCoverPhoto = formData.get("removeCoverPhoto") === "1";

  if (!title || !startDate) return;

  const update: Record<string, unknown> = { title, destination, start_date: startDate, end_date: endDate, cover_emoji: coverEmoji, notes };
  if (coverPhoto && coverPhoto.size > 0) {
    update.cover_photo_url = await uploadMediaFile("reference-photos", coverPhoto, "trip-covers");
  } else if (removeCoverPhoto) {
    update.cover_photo_url = null;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trips").update(update).eq("id", tripId);
  if (error) throw error;

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/", "layout");
}

export async function deleteTrip(tripId: string) {
  if (!tripId) return;
  const supabase = getSupabaseServerClient();
  // Untag any expenses rather than deleting them - the money was still spent.
  await supabase.from("expenses").update({ trip_id: null }).eq("trip_id", tripId);
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;

  revalidatePath("/trips");
  revalidatePath("/expenses");
  revalidatePath("/", "layout");
}

/** Turns a wrapped-up trip into a Memory, carrying over title/destination/dates/notes, then links the two together. */
export async function convertTripToMemory(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "").trim();
  if (!tripId) return;

  const supabase = getSupabaseServerClient();
  const { data: trip, error: tripError } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (tripError) throw tripError;

  const title = String(formData.get("title") ?? trip.title ?? "").trim() || trip.title;
  const story = String(formData.get("story") ?? "").trim() || trip.notes || null;
  const location = String(formData.get("location") ?? trip.destination ?? "").trim() || null;
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const files = formData.getAll("photos") as File[];

  const photoUrls = await uploadManyMediaFiles("memory-media", files, "memories");

  const { data: memory, error: memoryError } = await supabase
    .from("memories")
    .insert({
      title,
      story,
      location,
      memory_date: trip.end_date,
      tags,
      photos: photoUrls,
      trip_id: tripId,
    })
    .select()
    .single();
  if (memoryError) throw memoryError;

  if (photoUrls.length > 0) {
    const rows = photoUrls.map((url) => ({
      memory_id: memory.id,
      url,
      media_type: "photo" as const,
      tags,
      person: "us" as const,
    }));
    await supabase.from("gallery").insert(rows);
  }

  const { error: updateError } = await supabase.from("trips").update({ memory_id: memory.id }).eq("id", tripId);
  if (updateError) throw updateError;

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/memories");
  revalidatePath("/gallery");
  revalidatePath("/", "layout");
}

// ---- Logistics (transport & stays) ----

export async function addLogistics(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim() as TripLogisticsKind;
  const label = String(formData.get("label") ?? "").trim();
  if (!tripId || !label || (kind !== "transport" && kind !== "stay")) return;

  const fromLocation = String(formData.get("fromLocation") ?? "").trim() || null;
  const toLocation = String(formData.get("toLocation") ?? "").trim() || null;
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;
  const bookingRef = String(formData.get("bookingRef") ?? "").trim() || null;
  const costRaw = String(formData.get("cost") ?? "").trim();
  const cost = costRaw ? Number(costRaw) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const document = formData.get("document") as File | null;

  const documentUrl =
    document && document.size > 0 ? await uploadMediaFile("reference-photos", document, "trip-documents") : null;
  const documentName = document && document.size > 0 ? document.name : null;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trip_logistics").insert({
    trip_id: tripId,
    kind,
    label,
    from_location: fromLocation,
    to_location: toLocation,
    start_date: startDate,
    start_time: startTime,
    end_date: endDate,
    end_time: endTime,
    booking_ref: bookingRef,
    cost: cost && !Number.isNaN(cost) ? cost : null,
    notes,
    document_url: documentUrl,
    document_name: documentName,
  });
  if (error) throw error;

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteLogistics(logisticsId: string, tripId: string) {
  if (!logisticsId) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trip_logistics").delete().eq("id", logisticsId);
  if (error) throw error;

  revalidatePath(`/trips/${tripId}`);
}

// ---- Trip items (itinerary, packing, wishlist) ----

export async function addTripItem(formData: FormData) {
  const tripId = String(formData.get("tripId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").trim() as TripItemKind;
  const title = String(formData.get("title") ?? "").trim();
  if (!tripId || !title || !["itinerary", "packing", "wishlist"].includes(kind)) return;

  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dayDate = String(formData.get("dayDate") ?? "").trim() || null;
  const time = String(formData.get("time") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trip_items").insert({
    trip_id: tripId,
    kind,
    title,
    notes,
    day_date: kind === "itinerary" ? dayDate : null,
    time: kind === "itinerary" ? time : null,
    category: kind === "wishlist" ? category : null,
  });
  if (error) throw error;

  revalidatePath(`/trips/${tripId}`);
}

export async function toggleTripItem(itemId: string, tripId: string, done: boolean) {
  if (!itemId) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trip_items").update({ done }).eq("id", itemId);
  if (error) throw error;

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteTripItem(itemId: string, tripId: string) {
  if (!itemId) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("trip_items").delete().eq("id", itemId);
  if (error) throw error;

  revalidatePath(`/trips/${tripId}`);
}

