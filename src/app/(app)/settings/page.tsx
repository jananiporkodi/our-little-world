import { getSettingsMap } from "@/lib/data";
import SettingsClient from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettingsMap();
  return <SettingsClient settings={settings} />;
}
