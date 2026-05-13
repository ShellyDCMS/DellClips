"use client";

import { useState } from "react";

export default function ShareQrDialog() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        data-testid="share-qr-button"
        onClick={() => setIsOpen(true)}
        className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white
                   rounded-lg transition-colors text-sm inline-flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share with a Friend
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="share-qr-backdrop"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setIsOpen(false)}
      >
        {/* Dialog */}
        <div
          data-testid="share-qr-dialog"
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xs w-full
                     shadow-2xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Share DellClips</h2>
            <button
              data-testid="share-qr-close"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* QR Code */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-testid="share-qr-image"
            src="/qr-code.png"
            alt="Scan to open DellClips"
            className="w-full rounded-xl bg-white p-3"
          />

          {/* Instructions */}
          <p className="text-gray-400 text-sm mt-4">
            Show this QR code to a friend so they can scan it with their phone camera
          </p>

          {/* Close button */}
          <button
            data-testid="share-qr-done"
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
