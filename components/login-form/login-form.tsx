"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.toLowerCase().endsWith("@dell.com")) {
      setError("Please use your @dell.com email address.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("email", {
        email: email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: "/feed",
      });

      if (result?.error) {
        setError("Failed to send verification code. Please try again.");
        setIsLoading(false);
      } else {
        window.location.href = `/verify?email=${encodeURIComponent(email.toLowerCase().trim())}`;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Dell Email Address
        </label>
        <input
          id="email"
          data-testid="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@dell.com"
          required
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <p data-testid="error-message" className="text-red-400 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        data-testid="submit-button"
        disabled={isLoading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700
                   text-white font-semibold rounded-lg
                   transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <span data-testid="loading-indicator" className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending Code...
          </span>
        ) : (
          "Continue with Email"
        )}
      </button>
    </form>
  );
}
