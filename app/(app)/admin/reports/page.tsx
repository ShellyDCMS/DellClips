import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // TODO: Check if user has admin role
  // For now, any authenticated user can view reports

  const pendingReports = await databaseService.getPendingReports();

  return (
    <div className="h-full overflow-y-auto px-4 pt-12 pb-20">
      <h1 className="text-white text-xl font-bold mb-6">
        Reported Videos ({pendingReports.length})
      </h1>

      {pendingReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No pending reports 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">
                    {report.video.title || "Untitled video"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Reported by {report.reportedBy.name || report.reportedBy.email}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
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

              {report.description && (
                <p className="text-gray-400 text-sm mt-2 bg-gray-800 rounded-lg p-2">
                  &ldquo;{report.description}&rdquo;
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <form
                  action={async () => {
                    "use server";
                    const { auth } = await import("@/lib/auth");
                    const session = await auth();
                    if (!session?.user?.id) return;
                    const { databaseService } = await import("@/lib/services");
                    await databaseService.updateReportStatus(
                      report.id,
                      "dismissed",
                      session.user.id
                    );
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs
                               hover:bg-gray-700 transition-colors"
                  >
                    Dismiss
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    const { auth } = await import("@/lib/auth");
                    const session = await auth();
                    if (!session?.user?.id) return;
                    const { databaseService } = await import("@/lib/services");
                    await databaseService.updateReportStatus(
                      report.id,
                      "actioned",
                      session.user.id
                    );
                    await databaseService.deleteVideo(report.video.id);
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-red-900 text-red-300 rounded-lg text-xs
                               hover:bg-red-800 transition-colors"
                  >
                    Remove Video
                  </button>
                </form>
              </div>

              <p className="text-gray-600 text-xs mt-2">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
