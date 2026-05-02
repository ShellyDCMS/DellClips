import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-helpers";

export default async function FeedPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Dell<span className="text-blue-500">Clips</span>
        </h1>
        <p className="text-gray-400 mb-6">
          Welcome, {session.user?.email} 🎉
        </p>
        <p className="text-green-400 mb-8 text-sm">
          ✅ Authentication is working!
        </p>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white 
                       rounded-lg transition-colors text-sm"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}