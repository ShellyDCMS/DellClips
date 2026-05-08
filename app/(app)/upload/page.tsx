import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UploadClient from "./upload-client";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <UploadClient />;
}
