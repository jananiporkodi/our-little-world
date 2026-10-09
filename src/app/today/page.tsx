import { getSettingsMap, getGalleryMedia } from "@/lib/data";
import { todayIST } from "@/lib/dates";
import BirthdayClient from "@/components/birthday/BirthdayClient";

export const dynamic = "force-dynamic";

function utcMs(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export default async function TodayPage() {
  const [settings, media] = await Promise.all([getSettingsMap(), getGalleryMedia()]);

  const birthdayName = (settings.partner_a_name as string) || "Viswa";
  const fromName = (settings.partner_b_name as string) || "Janani";
  const birthday = (settings.partner_a_birthday as string) || "1994-10-09";
  const startDate = (settings.relationship_start_date as string) || null;

  const today = todayIST();
  const age = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4));
  const daysTogether = startDate ? Math.max(0, Math.round((utcMs(today) - utcMs(startDate)) / 86400000)) : null;

  // Favorites first, then the rest of the couple photos; spread evenly so it isn't just the newest few.
  const photos = media.filter((m) => m.media_type === "photo");
  const favorites = photos.filter((p) => p.is_favorite);
  const rest = photos.filter((p) => !p.is_favorite && p.person !== "her" && p.person !== "him");
  const step = Math.max(1, Math.floor(rest.length / 8));
  const spread = rest.filter((_, i) => i % step === 0);
  const picked = [...favorites, ...spread].slice(0, 9).map((p) => ({ url: p.url, caption: p.caption }));

  return (
    <BirthdayClient
      name={birthdayName}
      fromName={fromName}
      age={age}
      daysTogether={daysTogether}
      photos={picked}
    />
  );
}
