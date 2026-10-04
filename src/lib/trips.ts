import type { Trip, TripState } from "./types";
import { daysUntil, daysBetween } from "./dates";

/** A trip is "ongoing" for every day from its start through its end date (inclusive), not just the start day. */
export function getTripState(trip: Trip): TripState {
  const untilStart = daysUntil(trip.start_date);
  const untilEnd = daysUntil(trip.end_date);
  if (untilEnd < 0) return "completed";
  if (untilStart <= 0) return "ongoing";
  return "upcoming";
}

/** Whole days the trip spans, inclusive of both ends (a same-day trip is 1 day). */
export function tripDurationDays(trip: Trip): number {
  return daysBetween(trip.start_date, new Date(trip.end_date + "T00:00:00Z")) + 1;
}

// A small set of hand-picked gradient pairs, each named after the Tailwind theme colors already
// used throughout the app (peach, blush, lavender, accent) - used as the trip page's background
// "pattern" when the couple hasn't uploaded a cover photo of their own.
const THEME_GRADIENTS = [
  "linear-gradient(135deg, #ffd9c2 0%, #ffc9d6 100%)",
  "linear-gradient(135deg, #d8c9f0 0%, #ffc9d6 100%)",
  "linear-gradient(135deg, #ffd9c2 0%, #d8c9f0 100%)",
  "linear-gradient(135deg, #ffc9d6 0%, #e0556f 100%)",
  "linear-gradient(135deg, #d8c9f0 0%, #ffd9c2 100%)",
];

/** A small hash so the same trip always gets the same fallback gradient. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The CSS `background` value for a trip's themed page: the couple's own uploaded cover photo when
 * there is one, otherwise a deterministic gradient "pattern" so every trip still feels visually
 * distinct even without a photo.
 */
export function tripThemeBackground(trip: Trip): string {
  if (trip.cover_photo_url) return `url(${trip.cover_photo_url})`;
  return THEME_GRADIENTS[hashString(trip.id) % THEME_GRADIENTS.length];
}

/** Every "YYYY-MM-DD" date the trip covers, for building a day-by-day itinerary. */
export function tripDayKeys(trip: Trip): string[] {
  const [sy, sm, sd] = trip.start_date.split("-").map(Number);
  const [ey, em, ed] = trip.end_date.split("-").map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const keys: string[] = [];
  const MAX_DAYS = 60;
  for (let t = startUtc, i = 0; t <= endUtc && i < MAX_DAYS; t += 86400000, i++) {
    const d = new Date(t);
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  return keys;
}
