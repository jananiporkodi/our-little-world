import { cookies } from "next/headers";
import { getExpenses, getSettlements, getTrips, getPartnerNames } from "@/lib/data";
import { PARTNER_COOKIE_NAME, isValidPartnerId } from "@/lib/auth";
import ExpensesClient from "@/components/expenses/ExpensesClient";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const [expenses, settlements, trips, partnerNames] = await Promise.all([
    getExpenses(),
    getSettlements(),
    getTrips(),
    getPartnerNames(),
  ]);
  const currentPartnerRaw = cookies().get(PARTNER_COOKIE_NAME)?.value;
  const currentPartner = isValidPartnerId(currentPartnerRaw) ? currentPartnerRaw : null;

  return (
    <ExpensesClient
      expenses={expenses}
      settlements={settlements}
      trips={trips}
      partnerNames={partnerNames}
      currentPartner={currentPartner}
    />
  );
}
