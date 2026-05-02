import LoginForm from "@/components/login-form/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already logged in, redirect to feed
  const session = await auth();
  if (session?.user) {
    redirect("/feed");
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          Dell<span className="text-blue-500">Clips</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Short-form video for Dell employees
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 w-full max-w-sm bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error === "AccessDenied"
            ? "Only @dell.com email addresses are allowed."
            : "Something went wrong. Please try again."}
        </div>
      )}

      {/* Login Form */}
      <LoginForm />

      {/* Footer */}
      <p className="mt-8 text-gray-600 text-xs text-center max-w-xs">
        Sign in with your Dell email address. A magic link will be sent to
        verify your identity.
      </p>
    </div>
  );
}