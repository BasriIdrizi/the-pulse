import { ArticleStatus } from "@prisma/client";
import { createTRPCRouter, editorProcedure } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  overview: editorProcedure.query(async ({ ctx }) => {
    const since30 = new Date(Date.now() - 30 * 864e5);
    const [published, drafts, scheduled, users, comments, viewsAgg, topArticles, byCategory] =
      await Promise.all([
        ctx.db.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
        ctx.db.article.count({ where: { status: ArticleStatus.DRAFT } }),
        ctx.db.article.count({ where: { status: ArticleStatus.SCHEDULED } }),
        ctx.db.user.count(),
        ctx.db.comment.count({ where: { createdAt: { gte: since30 } } }),
        ctx.db.article.aggregate({ _sum: { viewCount: true } }),
        ctx.db.article.findMany({
          where: { status: ArticleStatus.PUBLISHED },
          orderBy: { viewCount: "desc" },
          take: 8,
          select: { id: true, title: true, slug: true, viewCount: true },
        }),
        ctx.db.category.findMany({
          select: {
            name: true,
            _count: { select: { articles: { where: { status: ArticleStatus.PUBLISHED } } } },
          },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

    return {
      published,
      drafts,
      scheduled,
      users,
      commentsLast30: comments,
      totalViews: viewsAgg._sum.viewCount ?? 0,
      topArticles,
      byCategory: byCategory.map((c) => ({ name: c.name, articles: c._count.articles })),
    };
  }),
});
