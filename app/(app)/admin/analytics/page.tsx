import { requireAdmin } from "@/lib/auth-helpers";
import AnalyticsClient from "./analytics-client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function AnalyticsPage() {
  await requireAdmin();
  return <AnalyticsClient />;
}
