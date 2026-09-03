import { Suspense } from "react";
import LockScreen from "./LockScreen";

export default function LockPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  return (
    <Suspense fallback={null}>
      <LockScreen redirectTo={searchParams.from || "/"} />
    </Suspense>
  );
}
