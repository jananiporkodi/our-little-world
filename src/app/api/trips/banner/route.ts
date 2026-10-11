import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateTripBanner } from "@/lib/tripBanner";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { tripId, force } = (await request.json().catch(() => ({}))) as { tripId?: string; force?: boolean };
  if (!tripId) return NextResponse.json({ ok: false }, { status: 400 });
  if (!process.env.HF_API_KEY_ID || !process.env.HF_API_KEY_SECRET) {
    return NextResponse.json({ ok: false, reason: "missing-keys" });
  }
  const url = await generateTripBanner(tripId, Boolean(force));
  if (url) {
    revalidatePath("/trips");
    revalidatePath(`/trips/${tripId}`);
  }
  return NextResponse.json({ ok: Boolean(url), url });
}
