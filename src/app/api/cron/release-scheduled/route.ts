import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * Promote SCHEDULED articles whose publish time has arrived.
 * Point a cron (Vercel Cron, GitHub Actions, or plain crontab) at:
 *   GET /api/cron/release-scheduled
 * Optionally protect it with CRON_SECRET via the Authorization header.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await db.article.updateMany({
    where: { status: ArticleStatus.SCHEDULED, publishedAt: { lte: new Date() } },
    data: { status: ArticleStatus.PUBLISHED },
  });

  if (result.count > 0) {
    revalidateTag("articles");
    revalidatePath("/");
  }

  return NextResponse.json({ released: result.count });
}
