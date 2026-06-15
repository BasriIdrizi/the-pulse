import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/server/db";
import { searchArticles } from "@/features/articles/queries";
import { publicSearchSchema } from "@/features/articles/schemas";
import { SearchFilters } from "@/features/search/components/search-filters";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleGridSkeleton } from "@/features/articles/components/article-card-skeleton";
import { SectionHeader } from "@/components/home/section-header";
import { Pagination } from "@/components/home/pagination";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search The Pulse archive — full-text search across every published story.",
  path: "/search",
});

export const dynamic = "force-dynamic";

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseParams(raw: RawParams) {
  const parsed = publicSearchSchema.safeParse({
    query: first(raw.q) || undefined,
    categorySlug: first(raw.category) || undefined,
    tagSlug: first(raw.tag) || undefined,
    authorId: first(raw.author) || undefined,
    from: first(raw.from) || undefined,
    to: first(raw.to) || undefined,
    page: Number(first(raw.page) ?? "1") || 1,
    perPage: 12,
  });
  return parsed.success ? parsed.data : publicSearchSchema.parse({ page: 1, perPage: 12 });
}

async function SearchResults({ raw }: { raw: RawParams }) {
  const input = parseParams(raw);
  const { items, total, page, perPage } = await searchArticles(input);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const persisted: Record<string, string> = {};
  for (const key of ["q", "category", "tag", "author", "from", "to"] as const) {
    const value = first(raw[key]);
    if (value) persisted[key] = value;
  }

  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {total === 0
          ? "No stories matched. Try a broader query or fewer filters."
          : `${total.toLocaleString()} ${total === 1 ? "story" : "stories"} found${
              input.query ? ` for “${input.query}”` : ""
            }`}
      </p>

      {items.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      <Pagination page={page} totalPages={totalPages} basePath="/search" searchParams={persisted} />
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;

  const [categories, tags, authors] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    db.user.findMany({
      where: { articles: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <SectionHeader title="Search the archive" />
      <div className="mt-6">
        <SearchFilters
          categories={categories.map((c) => ({ label: c.name, value: c.slug }))}
          tags={tags.map((t) => ({ label: t.name, value: t.slug }))}
          authors={authors.map((a) => ({ label: a.name ?? "Staff", value: a.id }))}
        />
      </div>
      <Suspense
        key={JSON.stringify(raw)}
        fallback={
          <div className="mt-6">
            <ArticleGridSkeleton count={6} />
          </div>
        }
      >
        <SearchResults raw={raw} />
      </Suspense>
    </div>
  );
}
