import { requireAdmin } from "@/lib/auth-helpers";
import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage() {
  await requireAdmin();
  return <AnalyticsClient />;
}
