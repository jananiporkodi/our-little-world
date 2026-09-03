"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSettings } from "@/app/(app)/settings/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary !py-2 !px-4 text-sm" disabled={pending}>
      {pending ? "Saving…" : "save settings"}
    </button>
  );
}

export default function SettingsClient({ settings }: { settings: Record<string, unknown> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <p className="font-hand text-4xl md:text-5xl leading-none mb-1">Settings 🌙</p>
      <p className="text-sm text-ink-soft mb-6">the basics that make this world yours</p>

      <form
        ref={formRef}
        action={async (formData) => {
          await updateSettings(formData);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        className="card-panel p-5 space-y-4 max-w-md"
      >
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
            Relationship start date
          </label>
          <input
            type="date"
            name="relationshipStartDate"
            defaultValue={(settings.relationship_start_date as string) ?? ""}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
            Anniversary date (optional)
          </label>
          <input
            type="date"
            name="anniversaryDate"
            defaultValue={(settings.anniversary_date as string) ?? ""}
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
              Partner A name
            </label>
            <input name="partnerAName" defaultValue={(settings.partner_a_name as string) ?? ""} className="input-field" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
              Partner B name
            </label>
            <input name="partnerBName" defaultValue={(settings.partner_b_name as string) ?? ""} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
              Partner A birthday
            </label>
            <input
              type="date"
              name="partnerABirthday"
              defaultValue={(settings.partner_a_birthday as string) ?? ""}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-ink-soft block mb-1">
              Partner B birthday
            </label>
            <input
              type="date"
              name="partnerBBirthday"
              defaultValue={(settings.partner_b_birthday as string) ?? ""}
              className="input-field"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SubmitButton />
          {saved && <span className="text-xs text-ink-soft">saved ✓</span>}
        </div>
      </form>
    </div>
  );
}
