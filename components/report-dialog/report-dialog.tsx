"use client";

import { REPORT_REASONS } from "@/lib/utils";
import { useState } from "react";

interface ReportDialogProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => void;
}

export default function ReportDialog({
  videoId: _videoId,
  isOpen,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, description || undefined);
    setSelectedReason("");
    setDescription("");
  };

  return (
    <div
      data-testid="report-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-white mb-4">Report Video</h2>

        <div data-testid="report-reasons" className="space-y-2 mb-4">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.code}
              data-testid={`report-reason-${reason.code}`}
              onClick={() => setSelectedReason(reason.code)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedReason === reason.code
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <textarea
          data-testid="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details (optional)"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 text-sm mb-4
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        <div className="flex gap-3">
          <button
            data-testid="report-cancel-button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm
                       hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            data-testid="report-submit-button"
            onClick={handleSubmit}
            disabled={!selectedReason}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-red-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
