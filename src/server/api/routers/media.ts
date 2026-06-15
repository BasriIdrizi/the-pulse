import { z } from "zod";
import { MediaType } from "@prisma/client";
import { createTRPCRouter, journalistProcedure, editorProcedure } from "@/server/api/trpc";

export const mediaRouter = createTRPCRouter({
  list: journalistProcedure
    .input(z.object({ type: z.nativeEnum(MediaType).optional(), cursor: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.media.findMany({
        where: input.type ? { type: input.type } : {},
        take: 25,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: { uploader: { select: { name: true } } },
      });
      return { items, nextCursor: items.length === 25 ? items.at(-1)?.id : undefined };
    }),

  // Register an asset by URL (S3 presigned upload or external host).
  register: journalistProcedure
    .input(
      z.object({
        url: z.string().url(),
        filename: z.string().min(1).max(200),
        type: z.nativeEnum(MediaType).default(MediaType.IMAGE),
        alt: z.string().max(200).optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        sizeBytes: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.media.create({ data: { ...input, uploaderId: ctx.session.user.id } }),
    ),

  delete: editorProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.media.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
