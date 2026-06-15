import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { ArticlesTable } from "./articles-table";

export const metadata: Metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin/articles");

  return (
    <ArticlesTable
      isEditor={hasRole(session.user.role, "EDITOR")}
      currentUserId={session.user.id}
    />
  );
}
