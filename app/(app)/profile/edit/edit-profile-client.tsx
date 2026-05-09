"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}

interface Props {
  user: User;
}

export default function EditProfileClient({ user }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [department, setDepartment] = useState(user.department || "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      setError("Image must be under 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 256, 256);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatarPreview(resizedDataUrl);
        setAvatarData(resizedDataUrl);
        setError("");
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const body: Record<string, string | undefined> = {};

      if (name !== (user.name || "")) body.name = name;
      if (bio !== (user.bio || "")) body.bio = bio;
      if (department !== (user.department || "")) body.department = department;
      if (jobTitle !== (user.jobTitle || "")) body.jobTitle = jobTitle;
      if (avatarData) body.image = avatarData;
      if (Object.keys(body).length === 0) {
        setError("No changes to save");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess("Profile updated!");
      setTimeout(() => {
        router.push("/profile/me");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError((err as Error).message);
    }

    setIsSaving(false);
  };

  const initial = name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase();

  return (
    <div data-testid="edit-profile" className="h-full overflow-y-auto px-4 pt-12 pb-20">
      <h1
        data-testid="edit-profile-title"
        className="text-white text-xl font-bold mb-6 text-center"
      >
        Edit Profile
      </h1>

      <div className="max-w-sm mx-auto space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <button
            data-testid="avatar-button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
          >
            <div
              className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center
                            text-white text-3xl font-bold overflow-hidden border-2 border-gray-600"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  data-testid="avatar-preview"
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span data-testid="avatar-initial">{initial}</span>
              )}
            </div>
            <div
              className="absolute inset-0 rounded-full bg-black/50 flex items-center
                            justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7-1c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
              </svg>
            </div>
          </button>
          <p className="text-gray-500 text-xs mt-2">Tap to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input
            data-testid="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={255}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-600 text-xs mt-1">
            Shown as @{name || user.email.split("@")[0]} on your videos
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Bio ({bio.length}/150)
          </label>
          <textarea
            data-testid="bio-input"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            placeholder="Tell us about yourself"
            maxLength={150}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Department / Team
          </label>
          <input
            data-testid="department-input"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., Engineering, Sales, HR"
            maxLength={100}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Job Title
          </label>
          <input
            data-testid="job-title-input"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Engineer, Sales Manager"
            maxLength={100}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error / Success */}
        {error && (
          <p data-testid="edit-profile-error" className="text-red-400 text-sm">
            {error}
          </p>
        )}
        {success && (
          <p data-testid="edit-profile-success" className="text-green-400 text-sm">
            {success}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            data-testid="cancel-button"
            onClick={() => router.back()}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg text-sm
                       hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            data-testid="save-button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-blue-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
