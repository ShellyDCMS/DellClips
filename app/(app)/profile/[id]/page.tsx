import FollowButton from "@/components/follow-button/follow-button";
import { auth, signOut } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { redirect } from "next/navigation";

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

  return (
    <div className="h-full flex flex-col pt-12 px-4 overflow-y-auto">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center
                        text-white text-2xl font-bold mb-3"
        >
          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
        </div>

        <h1 className="text-white text-xl font-bold">
          {user.name || user.email.split("@")[0]}
        </h1>
        <p className="text-gray-500 text-sm">{user.email}</p>

        {/* Stats */}
        <div className="flex gap-8 mt-4">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{userVideos.length}</p>
            <p className="text-gray-500 text-xs">Videos</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{followerCount}</p>
            <p className="text-gray-500 text-xs">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{followingCount}</p>
            <p className="text-gray-500 text-xs">Following</p>
          </div>
        </div>

        {/* Follow / Sign Out button */}
        <div className="mt-4">
          {isOwnProfile ? (
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
          ) : (
            <FollowButton userId={profileId} initialIsFollowing={isFollowing} />
          )}
        </div>
      </div>

      {/* User's Videos */}
      <div className="mt-8 pb-20">
        <h2 className="text-white font-bold text-sm mb-3">Videos</h2>
        {userVideos.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No videos yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {userVideos.map((video) => (
              <div
                key={video.id}
                className="aspect-[9/16] bg-gray-800 rounded-lg flex items-center
                           justify-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="text-center p-2">
                  <svg
                    className="w-6 h-6 text-gray-600 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p className="text-gray-500 text-[10px] mt-1 line-clamp-2">
                    {video.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
