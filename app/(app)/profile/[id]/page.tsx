import FollowButton from "@/components/follow-button/follow-button";
import { auth, signOut } from "@/lib/auth";
import { databaseService, videoService } from "@/lib/services";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const profileId = id === "me" ? session.user.id : id;
  const user = await databaseService.getUserById(profileId);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const isOwnProfile = profileId === session.user.id;
  const followerCount = await databaseService.getFollowerCount(profileId);
  const followingCount = await databaseService.getFollowingCount(profileId);
  const isFollowing = isOwnProfile
    ? false
    : await databaseService.isFollowing(session.user.id, profileId);
  const userVideos = await databaseService.getVideosByUserId(profileId);

  // Admin: get pending report count
  const pendingReportCount =
    isOwnProfile && user.role === "admin"
      ? (await databaseService.getPendingReports()).length
      : 0;

  // Get subscribed hashtags for own profile
  const subscribedHashtags = isOwnProfile
    ? await databaseService.getSubscribedHashtags(session.user.id)
    : [];

  return (
    <div className="h-full flex flex-col pt-12 px-4 overflow-y-auto pb-20">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div
          data-testid="profile-avatar"
          className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center
                     text-white text-2xl font-bold mb-3"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || ""}
              className="w-full h-full rounded-full object-cover"
              width={80}
              height={80}
            />
          ) : (
            user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name */}
        <h1 data-testid="profile-name" className="text-white text-xl font-bold">
          {user.name || user.email.split("@")[0]}
        </h1>

        {/* Email */}
        <p data-testid="profile-email" className="text-gray-500 text-sm">
          {user.email}
        </p>

        {/* Department & Job Title */}
        {(user.department || user.jobTitle) && (
          <p className="text-gray-500 text-xs mt-1">
            {[user.jobTitle, user.department].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Bio */}
        {user.bio && (
          <p
            data-testid="profile-bio"
            className="text-gray-300 text-sm mt-2 text-center max-w-xs"
          >
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <p data-testid="video-count" className="text-white font-bold text-lg">
              {userVideos.length}
            </p>
            <p className="text-gray-500 text-xs">Videos</p>
          </div>
          <div className="text-center">
            <p data-testid="follower-count" className="text-white font-bold text-lg">
              {followerCount}
            </p>
            <p className="text-gray-500 text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p data-testid="following-count" className="text-white font-bold text-lg">
              {followingCount}
            </p>
            <p className="text-gray-500 text-xs">Following</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {isOwnProfile ? (
            <>
              {/* Edit Profile */}
              <Link
                href="/profile/edit"
                data-testid="edit-profile-button"
                className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white
                 rounded-lg transition-colors text-sm"
              >
                Edit Profile
              </Link>
              {/* Sign Out */}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  data-testid="sign-out-button"
                  className="px-8 py-2 bg-gray-800 hover:bg-gray-700 text-white
                             rounded-lg transition-colors text-sm"
                >
                  Sign Out
                </button>
              </form>

              {/* Admin Link */}
              {user.role === "admin" && (
                <div className="flex gap-2 items-center">
                  <Link
                    href="/admin/reports"
                    data-testid="admin-reports-link"
                    className="px-4 py-2 bg-orange-900 text-orange-300 rounded-lg text-sm
                 hover:bg-orange-800 transition-colors inline-flex items-center gap-1"
                  >
                    📋 Reports
                    {pendingReportCount > 0 && (
                      <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {pendingReportCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/admin/analytics"
                    data-testid="admin-analytics-link"
                    className="px-4 py-2 bg-blue-900 text-blue-300 rounded-lg text-sm
                 hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
                  >
                    📊 Analytics
                  </Link>
                  <Link
                    href="/admin/settings"
                    data-testid="admin-settings-link"
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm
                 hover:bg-gray-700 transition-colors inline-flex items-center gap-1"
                  >
                    ⚙️ Settings
                  </Link>
                </div>
              )}
            </>
          ) : (
            /* Follow Button */
            <FollowButton userId={profileId} initialIsFollowing={isFollowing} />
          )}
        </div>
      </div>

      {/* Subscribed Hashtags (own profile only) */}
      {isOwnProfile && subscribedHashtags.length > 0 && (
        <div className="mt-8">
          <h2 className="text-white font-bold text-sm mb-3">Subscribed Hashtags</h2>
          <div className="flex flex-wrap gap-2">
            {subscribedHashtags.map((tag) => (
              <Link
                key={tag.name}
                href={`/search?hashtag=${encodeURIComponent(tag.name)}`}
                className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs
                           font-semibold hover:bg-blue-900 transition-colors
                           inline-flex items-center gap-1"
              >
                #{tag.name}
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User's Videos */}
      <div className="mt-8">
        <h2 className="text-white font-bold text-sm mb-3">Videos</h2>
        {userVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-gray-500 text-sm">
              {isOwnProfile ? "You haven't uploaded any videos yet" : "No videos yet"}
            </p>
            {isOwnProfile && (
              <Link
                href="/upload"
                className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white
                     rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Upload your first video
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {userVideos.map((video) => (
              <Link
                key={video.id}
                href={`/feed?video=${video.id}`}
                className="aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden
                     relative cursor-pointer hover:opacity-80 transition-opacity
                     block"
              >
                {/* Video Thumbnail */}
                <div className="absolute inset-0">
                  <video
                    src={videoService.getPlaybackUrl(video.videoPlaybackId)}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                </div>

                {/* Play Icon Overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center
                          bg-black/20"
                >
                  <svg
                    className="w-8 h-8 text-white/80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                {/* Video Info Overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-2
                       bg-gradient-to-t from-black/80 to-transparent"
                >
                  <p className="text-white text-[10px] line-clamp-2">
                    {video.title || "Untitled"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-400 text-[10px]">
                      ❤️ {video.likeCount}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      💬 {video.commentCount}
                    </span>
                  </div>
                </div>

                {/* Hashtags */}
                {video.hashtags.length > 0 && (
                  <div className="absolute top-1 left-1 right-1">
                    <p className="text-blue-400 text-[8px] truncate">
                      {video.hashtags.map((t) => `#${t}`).join(" ")}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
