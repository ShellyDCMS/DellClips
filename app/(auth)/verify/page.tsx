import { VerifyForm } from "./verify-form";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email || "";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mb-6 text-6xl">�</div>

        <h1 className="text-2xl font-bold text-white mb-3">Enter verification code</h1>

        <p className="text-gray-400 mb-6">
          We sent a 6-digit code to{" "}
          <strong className="text-gray-200">{email || "your email"}</strong>. Enter it
          below to sign in.
        </p>

        <VerifyForm email={email} />

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-500 text-sm">
            💡 The code expires in <strong className="text-gray-300">10 minutes</strong>.
            It may take <strong className="text-gray-300">1-3 minutes</strong> to arrive.
            Add <strong className="text-gray-300">dell.clips@dell.com</strong> to your
            contacts for faster delivery.
          </p>
        </div>

        <a
          href="/login"
          className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  );
}
