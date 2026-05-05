import NavBar from "@/components/nav-bar/nav-bar";
import { requireAuth } from "@/lib/auth-helpers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <main className="h-[calc(100vh-56px)]">{children}</main>
      <NavBar />
    </div>
  );
}
