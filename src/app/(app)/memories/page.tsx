import { getMemories, getPlans, getBucketItems, getPlaces, getPartnerNames, getTrips } from "@/lib/data";
import MemoriesClient from "@/components/memories/MemoriesClient";

export const dynamic = "force-dynamic";

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: { open?: string };
}) {
  const [memories, plans, bucketItems, places, partnerNames, trips] = await Promise.all([
    getMemories(),
    getPlans(),
    getBucketItems(),
    getPlaces(),
    getPartnerNames(),
    getTrips(),
  ]);

  return (
    <MemoriesClient
      memories={memories}
      plans={plans}
      bucketItems={bucketItems}
      places={places}
      partnerNames={partnerNames}
      trips={trips}
      initialOpenId={searchParams.open ?? null}
    />
  );
}
