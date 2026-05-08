import { requireAdmin } from "@/lib/auth-helpers";
import { databaseService } from "@/lib/services";
import AdminSettingsClient from "./settings-client";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const config = await databaseService.getAllConfig();

  return <AdminSettingsClient initialConfig={config} />;
}
