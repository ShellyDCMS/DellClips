import { auth } from "@/lib/auth";
import { databaseService } from "@/lib/services";
import { redirect } from "next/navigation";
import EditProfileClient from "./edit-profile-client";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await databaseService.getUserById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  return <EditProfileClient user={user} />;
}
