import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { MediaManager } from "./media-manager";

export const metadata: Metadata = { title: "Media" };

export default async function AdminMediaPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin/media");

  return <MediaManager isEditor={hasRole(session.user.role, "EDITOR")} />;
}
