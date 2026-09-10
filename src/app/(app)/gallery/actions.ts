"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadManyMediaFiles } from "@/lib/storage";

/** Direct-to-Gallery upload, independent of Memories. One optional caption applies to the whole batch. */
export async function addGalleryPhotos(formData: FormData) {
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const personRaw = String(formData.get("person") ?? "us").trim();
  const person = (["us", "him", "her"].includes(personRaw) ? personRaw : "us") as "us" | "him" | "her";
  const isFavorite = formData.get("favorite") === "on";
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const files = formData.getAll("photos") as File[];
  const urls = await uploadManyMediaFiles("memory-media", files, "gallery");
  if (urls.length === 0) return;

  const supabase = getSupabaseServerClient();
  const rows = urls.map((url) => ({
    url,
    media_type: "photo" as const,
    tags,
    person,
    is_favorite: isFavorite,
    caption,
  }));
  const { error } = await supabase.from("gallery").insert(rows);
  if (error) throw error;

  revalidatePath("/gallery");
  revalidatePath("/");
}
