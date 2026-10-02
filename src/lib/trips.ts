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
