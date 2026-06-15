import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryWithArticles } from "@/features/articles/queries";
import { ArticleCard } from "@/features/articles/components/article-card";
import { Pagination } from "@/components/home/pagination";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 120;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryWithArticles(slug, 1);
  if (!data) return { title: "Section not found" };
  return buildMetadata({
    title: `${data.category.name} News`,
    description: data.category.description ?? `The latest ${data.category.name} stories from The Pulse.`,
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page: pageParam }] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(pageParam) || 1);
  const data = await getCategoryWithArticles(slug, page);
  if (!data) notFound();

  const totalPages = Math.max(1, Math.ceil(data.total / data.perPage));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="border-b pb-6">
        <p className="kicker" style={{ color: data.category.color ?? "var(--pulse)" }}>Section</p>
        <h1 className="headline mt-2 text-4xl">{data.category.name}</h1>
        {data.category.description ? (
          <p className="article-body mt-2 max-w-2xl text-muted-foreground">{data.category.description}</p>
        ) : null}
      </header>

      {data.items.length > 0 ? (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-muted-foreground">No stories in this section yet. Check back soon.</p>
      )}

      <Pagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} />
    </div>
  );
}
