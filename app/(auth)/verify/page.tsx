export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Email icon */}
        <div className="mb-6 text-6xl">📧</div>

        <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>

        <p className="text-gray-400 mb-6">
          We sent a magic link to your Dell email address. Click the link in the email to
          sign in.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-500 text-sm">
            💡 The link expires in <strong className="text-gray-300">10 minutes</strong>.
            Check your spam folder if you don&apos;t see it.
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
