import NavBar from "@/components/nav-bar/nav-bar";
import { requireAuth } from "@/lib/auth-helpers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <main
        className="overflow-hidden"
        style={{
          height: "calc(100dvh - 56px - env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>
      <NavBar />
    </div>
  );
}
