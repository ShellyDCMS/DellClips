"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches
      : false
  );

  useEffect(() => {
    // Skip if already installed
    if (isInstalled) return;

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSinceDismissed =
        (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setShowPrompt(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", new Date().toISOString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div
      data-testid="pwa-install-prompt"
      className="fixed top-4 left-4 right-4 z-50 bg-gray-900 border border-gray-700
                 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top
                 max-w-sm mx-auto"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center
                        text-white font-bold text-lg flex-shrink-0"
        >
          DC
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">Install DellClips</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Add to your home screen for the best experience
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          data-testid="pwa-dismiss"
          onClick={handleDismiss}
          className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm
                     hover:bg-gray-700 transition-colors"
        >
          Not now
        </button>
        <button
          data-testid="pwa-install"
          onClick={handleInstall}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-blue-700 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
