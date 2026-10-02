import { getTrips } from "@/lib/data";
import TripsListClient from "@/components/trips/TripsListClient";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getTrips();
  return <TripsListClient trips={trips} />;
}
