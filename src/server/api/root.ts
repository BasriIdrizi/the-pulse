import { createTRPCRouter, createCallerFactory } from "@/server/api/trpc";
import { articleRouter } from "@/server/api/routers/article";
import { categoryRouter } from "@/server/api/routers/category";
import { tagRouter } from "@/server/api/routers/tag";
import { commentRouter } from "@/server/api/routers/comment";
import { userRouter } from "@/server/api/routers/user";
import { newsletterRouter } from "@/server/api/routers/newsletter";
import { mediaRouter } from "@/server/api/routers/media";
import { analyticsRouter } from "@/server/api/routers/analytics";

export const appRouter = createTRPCRouter({
  article: articleRouter,
  category: categoryRouter,
  tag: tagRouter,
  comment: commentRouter,
  user: userRouter,
  newsletter: newsletterRouter,
  media: mediaRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
