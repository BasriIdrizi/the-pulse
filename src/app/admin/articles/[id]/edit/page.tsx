import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { api } from "@/trpc/server";
import { Badge } from "@/components/ui/badge";
import { ArticleForm } from "../../article-form";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/sign-in?callbackUrl=/admin/articles/${id}/edit`);

  let article;
  try {
    article = await api.article.byIdForEdit({ id });
  } catch (error) {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="headline text-2xl font-black tracking-tight">Edit article</h1>
          <p className="text-sm text-muted-foreground">
            Every save creates a revision you can restore later.
          </p>
        </div>
        <Badge variant="outline">{article.status.replace("_", " ")}</Badge>
      </div>
      <ArticleForm
        mode="edit"
        articleId={article.id}
        isEditor={hasRole(session.user.role, "EDITOR")}
        initial={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage ?? "",
          coverAlt: article.coverAlt ?? "",
          categoryId: article.categoryId,
          tagIds: article.tags.map((t) => t.tagId),
          isFeatured: article.isFeatured,
          isBreaking: article.isBreaking,
          isTrending: article.isTrending,
        }}
      />
    </div>
  );
}
