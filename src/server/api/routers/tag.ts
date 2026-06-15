import { z } from "zod";
import { createTRPCRouter, publicProcedure, journalistProcedure } from "@/server/api/trpc";
import { slugify } from "@/lib/utils";

export const tagRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ),

  // Find-or-create so journalists can tag freely without an admin step.
  upsert: journalistProcedure
    .input(z.object({ name: z.string().min(2).max(40) }))
    .mutation(({ ctx, input }) => {
      const slug = slugify(input.name);
      return ctx.db.tag.upsert({
        where: { slug },
        update: {},
        create: { name: input.name.trim(), slug },
        select: { id: true, name: true, slug: true },
      });
    }),
});
