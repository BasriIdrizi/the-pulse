import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/api/trpc";
import { slugify } from "@/lib/utils";

const categoryInput = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const categoryRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, color: true, description: true, sortOrder: true },
    }),
  ),

  listWithCounts: adminProcedure.query(({ ctx }) =>
    ctx.db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { articles: true } } },
    }),
  ),

  create: adminProcedure.input(categoryInput).mutation(async ({ ctx, input }) => {
    const slug = slugify(input.name);
    const exists = await ctx.db.category.findFirst({
      where: { OR: [{ slug }, { name: input.name }] },
      select: { id: true },
    });
    if (exists) throw new TRPCError({ code: "CONFLICT", message: "Category already exists." });
    const category = await ctx.db.category.create({ data: { ...input, slug } });
    revalidatePath("/");
    return category;
  }),

  update: adminProcedure
    .input(categoryInput.partial().extend({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const category = await ctx.db.category.update({ where: { id }, data });
      revalidatePath("/");
      return category;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.article.count({ where: { categoryId: input.id } });
      if (count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Move or delete the ${count} article(s) in this category first.`,
        });
      }
      await ctx.db.category.delete({ where: { id: input.id } });
      revalidatePath("/");
      return { ok: true };
    }),
});
