import "server-only";

import { unstable_cache } from "next/cache";
import { ArticleStatus, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { PublicSearchInput } from "./schemas";

/**
 * During `next build` there is no database (the Docker image is built with a
 * placeholder DATABASE_URL). Pages that prerender at build — the homepage,
 * sitemap, and article generateStaticParams — would otherwise crash the build.
 * This helper swallows DB-unreachable errors ONLY in the build phase and returns
 * a safe fallback; at runtime errors propagate normally. The empty build-time
 * renders are filled in by ISR (revalidate + on-demand revalidation on publish).
 */
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export async function safeBuildQuery<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  if (!isBuildPhase) return run();
  try {
    return await run();
  } catch {
    return fallback;
  }
}

/** Shared shape for article cards across the site. */
export const articleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  coverAlt: true,
  readMinutes: true,
  viewCount: true,
  publishedAt: true,
  isBreaking: true,
  author: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true, color: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCardData = Prisma.ArticleGetPayload<{ select: typeof articleCardSelect }>;

const publishedWhere: Prisma.ArticleWhereInput = {
  status: ArticleStatus.PUBLISHED,
  publishedAt: { lte: new Date() },
};

// Live `publishedAt <= now()` must be computed per call, not captured once at module load.
const published = (): Prisma.ArticleWhereInput => ({
  status: ArticleStatus.PUBLISHED,
  publishedAt: { lte: new Date() },
});

/**
 * Homepage feed — one cached round trip for everything above the fold.
 * Tagged "articles" so publish/unpublish mutations invalidate it instantly;
 * the 60s revalidate is a safety net for scheduled releases.
 */
async function fetchHomepageData() {
  const [hero, breaking, trending, latest, mostViewed, editorPicks, categories] =
    await Promise.all([
      db.article.findFirst({
        where: { ...published(), isFeatured: true },
        orderBy: { publishedAt: "desc" },
        select: articleCardSelect,
      }),
      db.article.findFirst({
        where: { ...published(), isBreaking: true },
        orderBy: { publishedAt: "desc" },
        select: { title: true, slug: true },
      }),
      db.article.findMany({
        where: { ...published(), isTrending: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: articleCardSelect,
      }),
      db.article.findMany({
        where: published(),
        orderBy: { publishedAt: "desc" },
        take: 9,
        select: articleCardSelect,
      }),
      db.article.findMany({
        where: published(),
        orderBy: { viewCount: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, viewCount: true },
      }),
      db.article.findMany({
        where: { ...published(), isFeatured: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: articleCardSelect,
      }),
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          articles: {
            where: publishedWhere,
            orderBy: { publishedAt: "desc" },
            take: 3,
            select: articleCardSelect,
          },
        },
      }),
    ]);

  return { hero, breaking, trending, latest, mostViewed, editorPicks, categories };
}

type HomepageData = Awaited<ReturnType<typeof fetchHomepageData>>;

const EMPTY_HOMEPAGE: HomepageData = {
  hero: null,
  breaking: null,
  trending: [],
  latest: [],
  mostViewed: [],
  editorPicks: [],
  categories: [],
};

export const getHomepageData = unstable_cache(
  // No database during `next build` (placeholder DATABASE_URL) — fall back to an
  // empty homepage so the build succeeds; ISR fills it in at runtime. A real
  // runtime DB failure still surfaces normally.
  () => safeBuildQuery(fetchHomepageData, EMPTY_HOMEPAGE),
  ["homepage"],
  { revalidate: 60, tags: ["articles"] },
);

export async function getArticleBySlug(slug: string) {
  return db.article.findFirst({
    where: { slug, ...published() },
    select: {
      ...articleCardSelect,
      content: true,
      updatedAt: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
}

export async function getRelatedArticles(categoryId: string, excludeId: string) {
  return db.article.findMany({
    where: { ...published(), categoryId, id: { not: excludeId } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: articleCardSelect,
  });
}

export async function getPublishedSlugs() {
  return safeBuildQuery(
    () =>
      db.article.findMany({
        where: publishedWhere,
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 500,
      }),
    [] as { slug: string; updatedAt: Date }[],
  );
}

interface SearchRow {
  id: string;
  rank: number;
}

/**
 * Public search + filter with pagination.
 * Uses Postgres full-text ranking when a text query is present,
 * otherwise plain filtered listing.
 */
export async function searchArticles(input: PublicSearchInput) {
  const { query, categorySlug, tagSlug, authorId, from, to, page, perPage } = input;

  const filters: Prisma.ArticleWhereInput = {
    ...published(),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(authorId ? { authorId } : {}),
    ...(from || to ? { publishedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}), lte: to ?? new Date() } } : {}),
  };

  if (query?.trim()) {
    // Rank with tsvector, then hydrate the page of ids through the typed client.
    const matches = await db.$queryRaw<SearchRow[]>(Prisma.sql`
      SELECT "id", ts_rank("searchVector", websearch_to_tsquery('english', ${query})) AS rank
      FROM "Article"
      WHERE "searchVector" @@ websearch_to_tsquery('english', ${query})
        AND "status" = 'PUBLISHED'
        AND "publishedAt" <= NOW()
      ORDER BY rank DESC
      LIMIT 400
    `);

    const ids = matches.map((m) => m.id);
    if (ids.length === 0) return { items: [], total: 0, page, perPage };

    const [items, total] = await Promise.all([
      db.article.findMany({
        where: { ...filters, id: { in: ids } },
        select: articleCardSelect,
      }),
      db.article.count({ where: { ...filters, id: { in: ids } } }),
    ]);

    // Preserve relevance order from the raw query.
    const order = new Map(ids.map((id, i) => [id, i]));
    items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const start = (page - 1) * perPage;
    return { items: items.slice(start, start + perPage), total, page, perPage };
  }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where: filters,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: articleCardSelect,
    }),
    db.article.count({ where: filters }),
  ]);

  return { items, total, page, perPage };
}

export async function getCategoryWithArticles(slug: string, page: number, perPage = 12) {
  const category = await db.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, color: true },
  });
  if (!category) return null;

  const where: Prisma.ArticleWhereInput = { ...published(), categoryId: category.id };
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: articleCardSelect,
    }),
    db.article.count({ where }),
  ]);

  return { category, items, total, page, perPage };
}