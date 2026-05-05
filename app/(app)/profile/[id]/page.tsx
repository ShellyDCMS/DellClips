import { auth } from "@/lib/auth";
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

  // If "me", redirect to own profile
  const profileId = id === "me" ? session.user.id : id;
  const user = await databaseService.getUserById(profileId);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  const followerCount = await databaseService.getFollowerCount(profileId);
  const followingCount = await databaseService.getFollowingCount(profileId);

  return (
    <div className="h-full flex flex-col items-center pt-16 px-4">
      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center
                      text-white text-2xl font-bold mb-3"
      >
        {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <h1 className="text-white text-xl font-bold">
        {user.name || user.email.split("@")[0]}
      </h1>
      <p className="text-gray-500 text-sm">{user.email}</p>

      {/* Stats */}
      <div className="flex gap-8 mt-6">
        <div className="text-center">
          <p className="text-white font-bold text-lg">{followerCount}</p>
          <p className="text-gray-500 text-xs">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">{followingCount}</p>
          <p className="text-gray-500 text-xs">Following</p>
        </div>
      </div>
    </div>
  );
}
