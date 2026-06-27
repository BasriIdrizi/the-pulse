import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from "@/server/api/trpc";

/** Shared password rules: at least 10 chars, one uppercase, one number. */
const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
        password: passwordSchema,
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

  /** Admin creates a staff/user account directly, choosing the role. */
  adminCreate: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
        password: passwordSchema,
        role: z.nativeEnum(Role),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({ where: { email: input.email }, select: { id: true } });
      if (exists) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      const passwordHash = await bcrypt.hash(input.password, 12);
      await ctx.db.user.create({
        data: { name: input.name, email: input.email, passwordHash, role: input.role },
      });
      return { ok: true };
    }),

  /** Any signed-in user changes their own password (must confirm the current one). */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Enter your current password"),
        newPassword: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { passwordHash: true },
      });
      if (!user?.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This account has no password set." });
      }
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Your current password is incorrect." });
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({ where: { id: ctx.session.user.id }, data: { passwordHash } });
      return { ok: true };
    }),

  /** Admin resets another user's password (no current password required). */
  adminResetPassword: adminProcedure
    .input(z.object({ id: z.string().cuid(), newPassword: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({ where: { id: input.id }, data: { passwordHash } });
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
