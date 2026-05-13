"use client";

import { useEffect, useState } from "react";

// VAPID keys are base64url-encoded; the Push API requires a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const dismissed = localStorage.getItem("push-prompt-dismissed");
      if (dismissed) {
        const daysSince =
          (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
        } else {
          setShowPrompt(true);
        }
      } catch {
        // Push not supported
      }
    };
    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setIsSubscribed(true);
      setShowPrompt(false);
    } catch (err) {
      console.error("[push] Subscription failed:", err);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push-prompt-dismissed", new Date().toISOString());
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div
      data-testid="push-prompt"
      className="fixed top-4 left-4 right-4 z-50 bg-gray-900 border border-gray-700
                 rounded-2xl p-4 shadow-2xl max-w-sm mx-auto"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔔</div>
        <div className="flex-1">
          <h3 data-testid="push-prompt-heading" className="text-white font-bold text-sm">
            Stay in the loop
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Get notified when someone likes your video or when new content is posted
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          data-testid="push-prompt-dismiss"
          onClick={handleDismiss}
          className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm
                     hover:bg-gray-700 transition-colors"
        >
          Not now
        </button>
        <button
          data-testid="push-prompt-enable"
          onClick={handleSubscribe}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold
                     hover:bg-blue-700 transition-colors"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
