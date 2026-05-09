"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  username?: string | null;
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  profileLink?: string | null;
}

interface Props {
  user: User;
}

export default function EditProfileClient({ user }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [department, setDepartment] = useState(user.department || "");
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [profileLink, setProfileLink] = useState(user.profileLink || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      setError("Image must be under 1MB");
      return;
    }

    // Read as base64
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;

      // Create a canvas to resize the image to 256x256
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;

        // Crop to square (center crop)
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
      if (username !== (user.username || "")) body.username = username;
      if (bio !== (user.bio || "")) body.bio = bio;
      if (department !== (user.department || "")) body.department = department;
      if (jobTitle !== (user.jobTitle || "")) body.jobTitle = jobTitle;
      if (profileLink !== (user.profileLink || "")) body.profileLink = profileLink;
      if (avatarData) body.avatarUrl = avatarData;

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
                <span data-testid="avatar-preview" className="w-full h-full block">
                  <NextImage
                    src={avatarPreview}
                    alt="Profile"
                    width={96}
                    height={96}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </span>
              ) : (
                <span data-testid="avatar-initial">{initial}</span>
              )}
            </div>
            <div
              className="absolute inset-0 rounded-full bg-black/50 flex items-center
                            justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Display Name
          </label>
          <input
            data-testid="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            maxLength={255}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                       text-white placeholder-gray-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 text-sm">@</span>
            <input
              data-testid="username-input"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
              }
              placeholder="username"
              maxLength={50}
              className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">
            Letters, numbers, dots, hyphens, underscores
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

        {/* Dell Profile Link */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Dell Profile Link (optional)
          </label>
          <input
            data-testid="profile-link-input"
            type="url"
            value={profileLink}
            onChange={(e) => setProfileLink(e.target.value)}
            placeholder="https://dell.sharepoint.com/..."
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
