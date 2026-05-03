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
