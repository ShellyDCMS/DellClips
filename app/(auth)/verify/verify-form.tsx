"use client";

import { useState } from "react";

export function VerifyForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const callbackUrl = `/api/auth/callback/email?${new URLSearchParams({
        email,
        token: code,
        callbackUrl: "/feed",
      })}`;

      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6">
      <input
        data-testid="otp-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        autoFocus
        disabled={isLoading}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                   text-white text-center text-2xl tracking-[0.5em] font-mono
                   placeholder-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      />

      {error && (
        <p data-testid="verify-error" className="text-red-400 text-sm mb-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        data-testid="verify-submit"
        disabled={isLoading || code.length !== 6}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700
                   text-white font-semibold rounded-lg
                   transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Verifying..." : "Verify & Sign In"}
      </button>
    </form>
  );
}
