import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/api/trpc";

export const newsletterRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.newsletterSubscriber.upsert({
        where: { email: input.email },
        update: { unsubscribedAt: null },
        create: { email: input.email, isConfirmed: true, confirmedAt: new Date() },
      });
      return { ok: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.newsletterSubscriber.updateMany({
        where: { email: input.email },
        data: { unsubscribedAt: new Date() },
      });
      return { ok: true };
    }),

  list: adminProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }))
    .query(({ ctx, input }) =>
      ctx.db.newsletterSubscriber.findMany({
        where: input.activeOnly ? { unsubscribedAt: null } : {},
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [total, active, last30] = await Promise.all([
      ctx.db.newsletterSubscriber.count(),
      ctx.db.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
      ctx.db.newsletterSubscriber.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
      }),
    ]);
    return { total, active, last30 };
  }),
});
