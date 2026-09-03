"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const relationshipStartDate = String(formData.get("relationshipStartDate") ?? "").trim();
  const anniversaryDate = String(formData.get("anniversaryDate") ?? "").trim();
  const partnerAName = String(formData.get("partnerAName") ?? "").trim() || "Partner A";
  const partnerBName = String(formData.get("partnerBName") ?? "").trim() || "Partner B";
  const partnerABirthday = String(formData.get("partnerABirthday") ?? "").trim();
  const partnerBBirthday = String(formData.get("partnerBBirthday") ?? "").trim();

  const supabase = getSupabaseServerClient();

  const updates: { key: string; value: unknown }[] = [
    { key: "partner_a_name", value: partnerAName },
    { key: "partner_b_name", value: partnerBName },
  ];
  if (relationshipStartDate) updates.push({ key: "relationship_start_date", value: relationshipStartDate });
  if (anniversaryDate) updates.push({ key: "anniversary_date", value: anniversaryDate });
  if (partnerABirthday) updates.push({ key: "partner_a_birthday", value: partnerABirthday });
  if (partnerBBirthday) updates.push({ key: "partner_b_birthday", value: partnerBBirthday });

  for (const u of updates) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
  }

  revalidatePath("/settings");
  revalidatePath("/us");
  revalidatePath("/");
}
