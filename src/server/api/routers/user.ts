import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
        password: z
          .string()
          .min(10, "Password must be at least 10 characters")
          .regex(/[A-Z]/, "Include an uppercase letter")
          .regex(/[0-9]/, "Include a number"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const passwordHash = await bcrypt.hash(input.password, 12);
      await ctx.db.user.create({
        data: { name: input.name, email: input.email, passwordHash, role: Role.READER },
      });
      return { ok: true };
    }),

  list: adminProcedure
    .input(z.object({ query: z.string().max(80).optional(), role: z.nativeEnum(Role).optional() }))
    .query(({ ctx, input }) =>
      ctx.db.user.findMany({
        where: {
          ...(input.role ? { role: input.role } : {}),
          ...(input.query
            ? {
                OR: [
                  { name: { contains: input.query, mode: "insensitive" } },
                  { email: { contains: input.query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { articles: true, comments: true } },
        },
      }),
    ),

  setRole: adminProcedure
    .input(z.object({ id: z.string().cuid(), role: z.nativeEnum(Role) }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own role." });
      }
      await ctx.db.user.update({ where: { id: input.id }, data: { role: input.role } });
      return { ok: true };
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.string().cuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate yourself." });
      }
      await ctx.db.user.update({ where: { id: input.id }, data: { isActive: input.isActive } });
      return { ok: true };
    }),
});
