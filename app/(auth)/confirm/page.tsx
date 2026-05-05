"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/feed";
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const handleConfirm = () => {
    setIsLoading(true);
    // Redirect to the actual auth callback
    const params = new URLSearchParams({
      callbackUrl,
      token,
      email,
    });
    window.location.href = `/api/auth/callback/email?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-2">
          Dell<span className="text-blue-500">Clips</span>
        </h1>

        <p className="text-gray-400 mb-2 mt-6">Signing in as</p>
        <p className="text-white font-semibold mb-8">{email}</p>

        {error ? (
          <div className="mb-6">
            <p className="text-red-400 mb-4">
              This link has expired or was already used.
            </p>
            <a
              href="/login"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              ← Request a new magic link
            </a>
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700
                       text-white font-semibold rounded-lg
                       transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Confirm Sign In"}
          </button>
        )}

        <p className="mt-6 text-gray-600 text-xs">
          This extra step protects your account from email security scanners that may
          automatically click links.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
