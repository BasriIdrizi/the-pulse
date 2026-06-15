import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, editorProcedure } from "@/server/api/trpc";

export const commentRouter = createTRPCRouter({
  listByArticle: publicProcedure
    .input(z.object({ articleId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      ctx.db.comment.findMany({
        where: { articleId: input.articleId, isApproved: true, parentId: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, image: true } },
          replies: {
            where: { isApproved: true },
            orderBy: { createdAt: "asc" },
            take: 10,
            select: {
              id: true,
              body: true,
              createdAt: true,
              author: { select: { id: true, name: true, image: true } },
            },
          },
        },
      }),
    ),

  add: protectedProcedure
    .input(
      z.object({
        articleId: z.string().cuid(),
        body: z.string().min(2).max(2000),
        parentId: z.string().cuid().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.comment.create({
        data: { ...input, authorId: ctx.session.user.id },
        select: { id: true },
      }),
    ),

  remove: editorProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.comment.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  react: protectedProcedure
    .input(
      z.object({
        articleId: z.string().cuid(),
        type: z.enum(["LIKE", "LOVE", "INSIGHTFUL", "ANGRY", "SAD"]),
      }),
    )
    .mutation(({ ctx, input }) =>
      // Upsert = tapping a different reaction replaces the previous one.
      ctx.db.reaction.upsert({
        where: { userId_articleId: { userId: ctx.session.user.id, articleId: input.articleId } },
        update: { type: input.type },
        create: { ...input, userId: ctx.session.user.id },
        select: { id: true, type: true },
      }),
    ),
});
