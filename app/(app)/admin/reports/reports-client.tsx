"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  video: { id: string; title: string | null };
  reportedBy: { id: string; name: string | null; email: string };
}

export default function AdminReportsClient() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/reports");
        const data = await res.json();
        setReports(data.reports || []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  const handleAction = async (
    reportId: string,
    action: "dismiss" | "remove_video",
    videoId?: string
  ) => {
    if (processing) return;

    const confirmMessage =
      action === "remove_video"
        ? "Are you sure you want to remove this video? This cannot be undone."
        : "Dismiss this report?";

    if (!confirm(confirmMessage)) return;

    setProcessing(reportId);

    try {
      const res = await fetch("/api/admin/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action, videoId }),
      });

      if (res.ok) {
        // Remove from local state
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        router.refresh();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to process report:", err);
      alert("Failed to process report. Please try again.");
    }

    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-12 pb-20">
      <h1 data-testid="reports-title" className="text-white text-xl font-bold mb-6">
        Reported Videos ({reports.length})
      </h1>

      {reports.length === 0 ? (
        <div data-testid="reports-empty" className="text-center py-12">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-500">No pending reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              data-testid="report-item"
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p
                    data-testid="report-video-title"
                    className="text-white font-semibold text-sm truncate"
                  >
                    {report.video.title || "Untitled video"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Reported by {report.reportedBy.name || report.reportedBy.email}
                  </p>
                </div>
                <span
                  data-testid="report-reason"
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    report.reason === "restricted_data"
                      ? "bg-red-900 text-red-300"
                      : report.reason === "offensive"
                        ? "bg-orange-900 text-orange-300"
                        : report.reason === "harassment"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {report.reason.replace("_", " ")}
                </span>
              </div>

              {/* Description */}
              {report.description && (
                <p
                  data-testid="report-description"
                  className="text-gray-400 text-sm mt-2 bg-gray-800 rounded-lg p-2"
                >
                  &ldquo;{report.description}&rdquo;
                </p>
              )}

              {/* Timestamp */}
              <p className="text-gray-600 text-xs mt-2">
                {new Date(report.createdAt).toLocaleString()}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  data-testid="report-dismiss-button"
                  onClick={() => handleAction(report.id, "dismiss")}
                  disabled={processing === report.id}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs
                             hover:bg-gray-700 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === report.id ? "..." : "Dismiss"}
                </button>
                <button
                  data-testid="report-remove-button"
                  onClick={() => handleAction(report.id, "remove_video", report.video.id)}
                  disabled={processing === report.id}
                  className="px-4 py-2 bg-red-900 text-red-300 rounded-lg text-xs
                             hover:bg-red-800 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === report.id ? "..." : "Remove Video"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
