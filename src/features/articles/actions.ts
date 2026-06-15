"use server";

import { z } from "zod";
import { db } from "@/server/db";

const idSchema = z.string().cuid();

/** Fire-and-forget view tracking, called from a client effect on article pages. */
export async function trackArticleView(articleId: string) {
  const parsed = idSchema.safeParse(articleId);
  if (!parsed.success) return;
  await db.article
    .update({ where: { id: parsed.data }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined); // never let analytics break the page
}
