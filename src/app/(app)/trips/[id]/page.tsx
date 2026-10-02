import { notFound } from "next/navigation";
import { getTrip, getTripLogistics, getTripItems, getTripExpenses, getPartnerNames } from "@/lib/data";
import TripDetailClient from "@/components/trips/TripDetailClient";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  if (!trip) notFound();

  const [logistics, items, expenses, partnerNames] = await Promise.all([
    getTripLogistics(trip.id),
    getTripItems(trip.id),
    getTripExpenses(trip.id),
    getPartnerNames(),
  ]);

  return (
    <TripDetailClient trip={trip} logistics={logistics} items={items} expenses={expenses} partnerNames={partnerNames} />
  );
}
