import { requireAdmin } from "@/lib/auth-helpers";
import AdminReportsClient from "./reports-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReportsPage() {
  await requireAdmin();
  return <AdminReportsClient />;
}
