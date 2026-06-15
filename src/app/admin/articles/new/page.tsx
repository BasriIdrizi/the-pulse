import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { ArticleForm } from "../article-form";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin/articles/new");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl font-black tracking-tight">New article</h1>
        <p className="text-sm text-muted-foreground">File a fresh story for The Pulse.</p>
      </div>
      <ArticleForm mode="create" isEditor={hasRole(session.user.role, "EDITOR")} />
    </div>
  );
}
