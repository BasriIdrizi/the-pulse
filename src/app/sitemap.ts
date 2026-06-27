import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { getPublishedSlugs, safeBuildQuery } from "@/features/articles/queries";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories] = await Promise.all([
    getPublishedSlugs(),
    safeBuildQuery(
      () => db.category.findMany({ select: { slug: true } }),
      [] as { slug: string }[],
    ),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    // /search is intentionally excluded — it's noindex (thin/duplicate results).
    ...categories.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${SITE_URL}/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}