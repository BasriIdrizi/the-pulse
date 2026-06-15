import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Role } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { hasRole } from "@/lib/rbac";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();
  return { db, session, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } } });
});

/** Procedure gated to a minimum role in the hierarchy READER < JOURNALIST < EDITOR < ADMIN. */
export const roleProcedure = (minimum: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!hasRole(ctx.session.user.role, minimum)) {
      throw new TRPCError({ code: "FORBIDDEN", message: `Requires ${minimum} role or higher.` });
    }
    return next();
  });

export const journalistProcedure = roleProcedure("JOURNALIST");
export const editorProcedure = roleProcedure("EDITOR");
export const adminProcedure = roleProcedure("ADMIN");
