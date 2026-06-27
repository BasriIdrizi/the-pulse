import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Clock, Eye, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  getRelatedArticles,
  getPublishedSlugs,
} from "@/features/articles/queries";
import { ArticleCard } from "@/features/articles/components/article-card";
import { AdWidget } from "@/components/ads/ad-widget";
import { ViewTracker } from "@/features/articles/components/view-tracker";
import { SectionHeader } from "@/components/home/section-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buildMetadata, publisherJsonLd, SITE_URL } from "@/lib/seo";
import { formatNumber } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.slice(0, 50).map(({ slug }) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Story not found" };
  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/article/${article.slug}`,
    image: article.coverImage,
    type: "article",
    publishedTime: article.publishedAt?.toISOString(),
    authors: [article.author.name],
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.category.id, article.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: [{ "@type": "Person", name: article.author.name }],
    publisher: publisherJsonLd(),
    mainEntityOfPage: `${SITE_URL}/article/${article.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker articleId={article.id} />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          {article.isBreaking ? <Badge variant="pulse">Breaking</Badge> : null}
          <Link href={`/category/${article.category.slug}`} className="kicker text-pulse">
            {article.category.name}
          </Link>
        </div>
        <h1 className="headline mt-3 text-3xl md:text-5xl">{article.title}</h1>
        <p className="article-body mt-4 text-lg text-muted-foreground">{article.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Avatar className="size-8">
              {article.author.image ? <AvatarImage src={article.author.image} alt="" /> : null}
              <AvatarFallback>{article.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground">{article.author.name}</span>
          </span>
          {article.publishedAt ? <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, "MMMM d, yyyy · h:mm a")}</time> : null}
          <span className="flex items-center gap-1"><Clock className="size-3.5" /> {article.readMinutes} min</span>
          <span className="flex items-center gap-1"><Eye className="size-3.5" /> {formatNumber(article.viewCount)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="size-3.5" /> {article._count.comments}</span>
        </div>
      </header>

      {article.coverImage ? (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={article.coverImage}
              alt={article.coverAlt ?? ""}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
          {article.coverAlt ? (
            <figcaption className="mt-2 text-xs text-muted-foreground">{article.coverAlt}</figcaption>
          ) : null}
        </figure>
      ) : null}

      {/* Content is staff-authored HTML from the Tiptap editor (trusted input). */}
      <div
        className="article-body prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-extrabold prose-blockquote:border-l-pulse"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {article.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map(({ tag }) => (
            <Link key={tag.slug} href={`/search?tag=${tag.slug}`}>
              <Badge variant="secondary">#{tag.name}</Badge>
            </Link>
          ))}
        </div>
      ) : null}

      {/* In-content ad: after the story body, above related stories. */}
      <AdWidget
        widgetId={process.env.NEXT_PUBLIC_ADSKEEPER_ARTICLE_ID ?? ""}
        scriptSrc={process.env.NEXT_PUBLIC_ADSKEEPER_ARTICLE_SRC ?? ""}
      />

      <Separator className="my-10" />

      {related.length > 0 ? (
        <section aria-label="Related stories">
          <SectionHeader title={`More in ${article.category.name}`} accent={article.category.color} />
          <div className="grid gap-8 sm:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
