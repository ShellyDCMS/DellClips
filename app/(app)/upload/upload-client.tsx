"use client";

import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "details" | "uploading" | "done">("select");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    // Validate file size (200MB max)
    if (selectedFile.size > 200 * 1024 * 1024) {
      setError("Video must be under 200MB");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError("");
    setStep("details");
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.toLowerCase().replace(/^#/, "").replace(/\s+/g, "").trim();
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStep("uploading");
    setError("");

    try {
      // Step 1: Get presigned upload URL from our API
      setUploadProgress(10);
      const urlRes = await fetch("/api/video/upload-url", {
        method: "POST",
      });

      if (!urlRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, assetId } = await urlRes.json();
      setUploadProgress(20);

      // Step 2: Upload video directly to Cloudflare Stream
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload video");
      }

      setUploadProgress(70);

      // Step 3: Create video record in our database
      const videoRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          description: description || undefined,
          videoAssetId: assetId,
          videoPlaybackId: assetId,
          hashtags: hashtags.length > 0 ? hashtags : undefined,
        }),
      });

      if (!videoRes.ok) {
        throw new Error("Failed to save video record");
      }

      setUploadProgress(100);
      setStep("done");
      trackEvent("video_upload", assetId, { title, hashtags });

      // Redirect to feed after a short delay
      setTimeout(() => {
        router.push("/feed");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError((err as Error).message || "Upload failed. Please try again.");
      setStep("details");
      setIsUploading(false);
    }
  };

  return (
    <div
      data-testid="upload-container"
      className="h-full overflow-y-auto px-4 pt-8 pb-20"
    >
      <h1
        data-testid="upload-title"
        className="text-white text-xl font-bold mb-6 text-center"
      >
        Upload Video
      </h1>

      {/* Step 1: Select Video */}
      {step === "select" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            data-testid="file-dropzone"
            onClick={() => fileInputRef.current?.click()}
            className="w-48 h-72 bg-gray-900 border-2 border-dashed border-gray-700
                       rounded-2xl flex flex-col items-center justify-center cursor-pointer
                       hover:border-blue-500 transition-colors"
          >
            <svg
              className="w-12 h-12 text-gray-600 mb-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
            </svg>
            <p className="text-gray-500 text-sm">Tap to select video</p>
            <p className="text-gray-600 text-xs mt-1">MP4, max 60s, max 200MB</p>
          </div>

          <input
            data-testid="file-input"
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <p data-testid="upload-error" className="text-red-400 text-sm mt-4">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Step 2: Add Details */}
      {step === "details" && (
        <div className="max-w-sm mx-auto space-y-4">
          {/* Video Preview */}
          {preview && (
            <div className="aspect-[9/16] max-h-48 bg-black rounded-xl overflow-hidden mx-auto w-32">
              <video
                src={preview}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              data-testid="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a title"
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              data-testid="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your video about?"
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hashtags ({hashtags.length}/10)
            </label>
            <div className="flex gap-2">
              <input
                data-testid="hashtag-input"
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Add a hashtag"
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg
                           text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                data-testid="add-hashtag-button"
                onClick={handleAddHashtag}
                disabled={!hashtagInput.trim() || hashtags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/50
                               text-blue-400 rounded-full text-xs"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveHashtag(tag)}
                      className="text-blue-300 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p data-testid="details-error" className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              data-testid="back-button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setStep("select");
              }}
              className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg text-sm
                         hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              data-testid="upload-button"
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold
                         hover:bg-blue-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Uploading */}
      {step === "uploading" && (
        <div
          data-testid="uploading-step"
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="w-20 h-20 mb-6 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#1f2937"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeDasharray={`${uploadProgress} 100`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
              {uploadProgress}%
            </span>
          </div>
          <p className="text-white font-semibold">Uploading your video...</p>
          <p className="text-gray-500 text-sm mt-1">
            {uploadProgress < 30
              ? "Preparing upload..."
              : uploadProgress < 70
                ? "Sending to Cloudflare Stream..."
                : "Saving video details..."}
          </p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div
          data-testid="done-step"
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 data-testid="done-title" className="text-white text-xl font-bold mb-2">
            Upload Complete!
          </h2>
          <p className="text-gray-400 text-sm text-center">
            Your video is being processed and will appear in the feed shortly.
          </p>
          <p className="text-gray-500 text-xs mt-2">Redirecting to feed...</p>
        </div>
      )}
    </div>
  );
}
