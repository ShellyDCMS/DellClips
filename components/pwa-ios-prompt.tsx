"use client";

import { useEffect, useState } from "react";

export default function PWAiOSPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Detect iOS device (not browser — we don't care which browser)
    const isiOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    // Check if previously dismissed
    const dismissed = localStorage.getItem("pwa-ios-dismissed");
    if (dismissed) {
      const daysSince =
        (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 14) return;
    }

    if (isiOSDevice) {
      setTimeout(() => setShowPrompt(true), 2000);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-ios-dismissed", new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div
      data-testid="pwa-ios-prompt"
      className="fixed bottom-20 left-4 right-4 z-50 bg-gray-900 border border-gray-700
                 rounded-2xl p-4 shadow-2xl max-w-sm mx-auto"
    >
      <button
        data-testid="pwa-ios-dismiss"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-500 hover:text-white
                   transition-colors p-1"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt="DellClips"
          className="w-10 h-10 rounded-xl flex-shrink-0"
        />
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">Install DellClips</h3>
          <p className="text-gray-400 text-xs mt-1">
            To install this app on your device:
          </p>
        </div>
      </div>

      {/* Step-by-step instructions — no browser name mentioned */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0"
          >
            1
          </span>
          <p className="text-gray-300 text-xs">
            Tap the{" "}
            <svg
              className="w-4 h-4 text-blue-400 inline-block mx-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
            </svg>{" "}
            <strong className="text-white">Share</strong> button in your browser
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0"
          >
            2
          </span>
          <p className="text-gray-300 text-xs">
            Scroll and tap{" "}
            <strong className="text-white">&quot;Add to Home Screen&quot;</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0"
          >
            3
          </span>
          <p className="text-gray-300 text-xs">
            Tap <strong className="text-white">&quot;Add&quot;</strong> to confirm
          </p>
        </div>
      </div>

      <p className="text-gray-600 text-[10px] mt-3 text-center">
        Look for the Share button in your browser&apos;s toolbar
      </p>
    </div>
  );
}
