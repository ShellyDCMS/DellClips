import { requireAuth } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This protects ALL routes under (app)/
  await requireAuth();

  return <>{children}</>;
}