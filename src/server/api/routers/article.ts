import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ArticleStatus, Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  createTRPCRouter,
  journalistProcedure,
  editorProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  articleCreateSchema,
  articleUpdateSchema,
  articleScheduleSchema,
  articleListFilterSchema,
} from "@/features/articles/schemas";
import { hasRole } from "@/lib/rbac";
import { estimateReadMinutes } from "@/lib/utils";

/** Invalidate the public cache after any change that affects published pages. */
function revalidatePublic(slug?: string) {
  revalidateTag("articles");
  revalidatePath("/");
  if (slug) revalidatePath(`/article/${slug}`);
}

/** Journalists may only touch their own articles; editors and admins may touch any. */
async function assertCanManage(
  db: Prisma.TransactionClient | typeof import("@/server/db").db,
  articleId: string,
  user: { id: string; role: "ADMIN" | "EDITOR" | "JOURNALIST" | "READER" },
) {
  const article = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true, slug: true, status: true },
  });
  if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found." });
  if (!hasRole(user.role, "EDITOR") && article.authorId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only manage your own articles." });
  }
  return article;
}

export const articleRouter = createTRPCRouter({
  // ---------- Staff: write operations ----------

  create: journalistProcedure.input(articleCreateSchema).mutation(async ({ ctx, input }) => {
    const { tagIds, ...data } = input;

    const exists = await ctx.db.article.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (exists) throw new TRPCError({ code: "CONFLICT", message: "Slug is already in use." });

    // Journalists cannot self-feature or mark breaking; that is an editorial decision.
    const isEditor = hasRole(ctx.session.user.role, "EDITOR");

    return ctx.db.article.create({
      data: {
        ...data,
        coverImage: data.coverImage || null,
        isFeatured: isEditor ? data.isFeatured : false,
        isBreaking: isEditor ? data.isBreaking : false,
        isTrending: isEditor ? data.isTrending : false,
        readMinutes: estimateReadMinutes(data.content),
        authorId: ctx.session.user.id,
        status: ArticleStatus.DRAFT,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
      select: { id: true, slug: true },
    });
  }),

  update: journalistProcedure.input(articleUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, tagIds, revisionNote, ...data } = input;
    const existing = await assertCanManage(ctx.db, id, ctx.session.user);

    const isEditor = hasRole(ctx.session.user.role, "EDITOR");

    return ctx.db.$transaction(async (tx) => {
      // Snapshot the current version before overwriting — this is the revision history.
      const current = await tx.article.findUniqueOrThrow({
        where: { id },
        select: { title: true, excerpt: true, content: true },
      });
      await tx.articleRevision.create({
        data: {
          articleId: id,
          editorId: ctx.session.user.id,
          note: revisionNote,
          ...current,
        },
      });

      const updated = await tx.article.update({
        where: { id },
        data: {
          ...data,
          ...(data.coverImage !== undefined ? { coverImage: data.coverImage || null } : {}),
          ...(data.content ? { readMinutes: estimateReadMinutes(data.content) } : {}),
          // Non-editors cannot flip editorial flags.
          ...(isEditor
            ? {}
            : { isFeatured: undefined, isBreaking: undefined, isTrending: undefined }),
          ...(tagIds
            ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } }
            : {}),
        },
        select: { id: true, slug: true, status: true },
      });

      if (updated.status === ArticleStatus.PUBLISHED) revalidatePublic(existing.slug);
      return updated;
    });
  }),

  publish: editorProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.update({
        where: { id: input.id },
        data: { status: ArticleStatus.PUBLISHED, publishedAt: new Date() },
        select: { slug: true },
      });
      revalidatePublic(article.slug);
      return { ok: true };
    }),

  unpublish: editorProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const article = await ctx.db.article.update({
        where: { id: input.id },
        data: { status: ArticleStatus.DRAFT, isBreaking: false, isFeatured: false },
        select: { slug: true },
      });
      revalidatePublic(article.slug);
      return { ok: true };
    }),

  schedule: editorProcedure.input(articleScheduleSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.article.update({
      where: { id: input.id },
      data: { status: ArticleStatus.SCHEDULED, publishedAt: input.publishedAt },
    });
    return { ok: true };
  }),

  delete: journalistProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const article = await assertCanManage(ctx.db, input.id, ctx.session.user);
      await ctx.db.article.delete({ where: { id: input.id } });
      revalidatePublic(article.slug);
      return { ok: true };
    }),

  // ---------- Staff: read operations ----------

  listForDashboard: journalistProcedure
    .input(articleListFilterSchema)
    .query(async ({ ctx, input }) => {
      const isEditor = hasRole(ctx.session.user.role, "EDITOR");
      const where: Prisma.ArticleWhereInput = {
        // Journalists only see their own work in the dashboard.
        ...(isEditor ? {} : { authorId: ctx.session.user.id }),
        ...(input.status ? { status: input.status } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.authorId && isEditor ? { authorId: input.authorId } : {}),
        ...(input.query
          ? { title: { contains: input.query, mode: "insensitive" } }
          : {}),
      };

      const items = await ctx.db.article.findMany({
        where,
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isFeatured: true,
          isBreaking: true,
          viewCount: true,
          publishedAt: true,
          updatedAt: true,
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) nextCursor = items.pop()?.id;
      return { items, nextCursor };
    }),

  byIdForEdit: journalistProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      await assertCanManage(ctx.db, input.id, ctx.session.user);
      return ctx.db.article.findUniqueOrThrow({
        where: { id: input.id },
        include: { tags: { select: { tagId: true } } },
      });
    }),

  revisions: journalistProcedure
    .input(z.object({ articleId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      await assertCanManage(ctx.db, input.articleId, ctx.session.user);
      return ctx.db.articleRevision.findMany({
        where: { articleId: input.articleId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          note: true,
          createdAt: true,
          editor: { select: { name: true } },
        },
      });
    }),

  restoreRevision: editorProcedure
    .input(z.object({ revisionId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await ctx.db.articleRevision.findUniqueOrThrow({
        where: { id: input.revisionId },
        include: { article: { select: { slug: true } } },
      });
      await ctx.db.article.update({
        where: { id: revision.articleId },
        data: { title: revision.title, excerpt: revision.excerpt, content: revision.content },
      });
      revalidatePublic(revision.article.slug);
      return { ok: true };
    }),

  // ---------- Public ----------

  /** Promote any SCHEDULED articles whose time has come. Call from a cron route. */
  releaseScheduled: publicProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.article.updateMany({
      where: { status: ArticleStatus.SCHEDULED, publishedAt: { lte: new Date() } },
      data: { status: ArticleStatus.PUBLISHED },
    });
    if (result.count > 0) revalidatePublic();
    return { released: result.count };
  }),
});
