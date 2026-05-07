import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Get the current session. Returns null if not authenticated.
 * Use in Server Components and API routes.
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use in Server Components for protected pages.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Require admin role. Redirects to /feed if not an admin.
 * Use in Server Components for admin-only pages.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check the user's role in the database
  const { databaseService } = await import("@/lib/services");
  const user = await databaseService.getUserById(session.user.id);

  if (!user || user.role !== "admin") {
    redirect("/feed");
  }

  return session;
}

/**
 * Get the current user ID. Throws if not authenticated.
 * Use in API routes.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}
