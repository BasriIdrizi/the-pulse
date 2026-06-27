import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { getHomepageData } from "@/features/articles/queries";
import { ArticleCard } from "@/features/articles/components/article-card";
import { BreakingBanner } from "@/components/layout/breaking-banner";
import { SectionHeader } from "@/components/home/section-header";
import { NewsletterForm } from "@/features/newsletter/components/newsletter-form";
import { PulseMark } from "@/components/layout/pulse-mark";
import { formatNumber } from "@/lib/utils";
import { buildMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

// ISR: page regenerates at most every 60s; publish mutations also revalidate it on demand.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "The stories America is talking about",
  description:
    "Viral news, true crime, and the strange corners of America — reported straight, updated all day.",
  path: "/",
});

export default async function HomePage() {
  const { hero, breaking, trending, latest, mostViewed, editorPicks, categories } =
    await getHomepageData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <BreakingBanner article={breaking} />

      <div className="mx-auto max-w-7xl px-4">
        {/* Hero: lead story + most-viewed rail */}
        <section className="grid gap-10 py-10 lg:grid-cols-3" aria-label="Top story">
          <div className="lg:col-span-2">
            {hero ? (
              <ArticleCard article={hero} variant="hero" priority />
            ) : (
              <EmptyState message="No featured story yet. Publish and feature an article to fill the hero." />
            )}
          </div>
          <aside aria-label="Most viewed">
            <SectionHeader title="Most viewed" />
            <ol className="space-y-4">
              {mostViewed.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="headline text-2xl text-pulse/40">{i + 1}</span>
                  <div>
                    <Link
                      href={`/article/${a.slug}`}
                      className="font-display text-sm font-bold leading-snug hover:text-pulse"
                    >
                      {a.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(a.viewCount)} reads
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* Trending */}
        {trending.length > 0 ? (
          <section className="py-8" aria-label="Trending">
            <SectionHeader title="Trending now" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Latest */}
        <section className="py-8" aria-label="Latest news">
          <SectionHeader title="Latest" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>

        {/* Newsletter band */}
        <section className="my-10 rounded-lg border bg-card p-8 md:p-10" aria-label="Newsletter">
          <div className="mx-auto max-w-xl text-center">
            <PulseMark animated className="mx-auto h-6 w-16 text-pulse" />
            <h2 className="headline mt-3 text-2xl md:text-3xl">The Daily Pulse</h2>
            <p className="article-body mt-2 text-muted-foreground">
              One email a day. The five stories everyone will be talking about — before they are.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
          </div>
        </section>

        {/* Editor picks */}
        {editorPicks.length > 0 ? (
          <section className="py-8" aria-label="Editor picks">
            <SectionHeader title="Editor picks" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {editorPicks.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Category sections */}
        {categories
          .filter((c) => c.articles.length > 0)
          .map((c) => (
            <section key={c.id} className="py-8" aria-label={c.name}>
              <div className="flex items-center justify-between">
                <SectionHeader title={c.name} accent={c.color} />
                <Link
                  href={`/category/${c.slug}`}
                  className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-pulse"
                >
                  All {c.name} <TrendingUp className="size-3.5" />
                </Link>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {c.articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
