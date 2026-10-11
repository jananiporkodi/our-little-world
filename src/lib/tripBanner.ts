import "server-only";
import { getSupabaseServerClient } from "./supabase/server";
import { uploadMediaFile } from "./storage";

const BASE = "https://platform.higgsfield.ai";
const MODEL_PATH = "/higgsfield-ai/soul/v2/standard";

function authHeader(): string | null {
  const id = process.env.HF_API_KEY_ID;
  const secret = process.env.HF_API_KEY_SECRET;
  if (!id || !secret) return null;
  return `Key ${id.trim()}:${secret.trim()}`;
}

export function bannerPrompt(place: string): string {
  return (
    `Wide illustrated travel-poster banner of ${place}, soft pastel watercolor-and-gouache style, ` +
    `warm peach, pink and lavender palette, golden-hour light. Show the best-known landmarks, scenery and ` +
    `everyday charm of ${place}, with a tiny couple silhouette enjoying the view. Charming, cozy, romantic mood. ` +
    `Keep the upper-left area calm and uncluttered for overlaying text. No text, no letters, no logos, no watermark.`
  );
}

async function submit(auth: string, prompt: string, withAspect: boolean): Promise<Response> {
  return fetch(`${BASE}${MODEL_PATH}`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(withAspect ? { prompt, aspect_ratio: "16:9" } : { prompt }),
  });
}

/**
 * Generates a Higgsfield banner for the trip's destination, copies it into our own
 * storage (Higgsfield links expire), and saves it as the trip's cover photo.
 * Returns the stored URL, or null if it was skipped / failed (never throws).
 */
export async function generateTripBanner(tripId: string, force = false): Promise<string | null> {
  try {
    const auth = authHeader();
    if (!auth) return null;

    const supabase = getSupabaseServerClient();
    const { data: trip } = await supabase
      .from("trips")
      .select("id, title, destination, cover_photo_url")
      .eq("id", tripId)
      .single();
    if (!trip) return null;
    if (trip.cover_photo_url && !force) return null;

    const place = (trip.destination || trip.title || "").trim();
    if (!place) return null;
    const prompt = bannerPrompt(place);

    let res = await submit(auth, prompt, true);
    if (!res.ok) res = await submit(auth, prompt, false);
    if (!res.ok) return null;
    const job = (await res.json()) as { request_id?: string; status_url?: string };
    const statusUrl = job.status_url ?? (job.request_id ? `${BASE}/requests/${job.request_id}/status` : null);
    if (!statusUrl) return null;

    let imageUrl: string | null = null;
    for (let i = 0; i < 24 && !imageUrl; i++) {
      await new Promise((r) => setTimeout(r, Math.min(1500 + i * 500, 4000)));
      const s = await fetch(statusUrl, { headers: { Authorization: auth, Accept: "application/json" } });
      if (!s.ok) continue;
      const body = (await s.json()) as { status?: string; images?: { url: string }[] };
      if (body.status === "completed") imageUrl = body.images?.[0]?.url ?? null;
      else if (body.status && ["failed", "nsfw", "canceled"].includes(body.status)) return null;
    }
    if (!imageUrl) return null;

    const img = await fetch(imageUrl);
    if (!img.ok) return null;
    const blob = await img.blob();
    const type = blob.type || "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const file = new File([blob], `banner.${ext}`, { type });
    const stored = await uploadMediaFile("reference-photos", file, "trip-covers");

    await supabase.from("trips").update({ cover_photo_url: stored }).eq("id", tripId);
    return stored;
  } catch {
    return null;
  }
}
