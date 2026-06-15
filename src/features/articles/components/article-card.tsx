import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import type { ArticleCardData } from "@/features/articles/queries";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  article: ArticleCardData;
  variant?: "default" | "hero" | "compact";
  priority?: boolean;
}

export function ArticleCard({ article, variant = "default", priority = false }: Props) {
  const href = `/article/${article.slug}`;
  const date = article.publishedAt ? format(article.publishedAt, "MMM d, yyyy") : "";

  if (variant === "compact") {
    return (
      <article className="group flex gap-3 py-3">
        <div className="min-w-0 flex-1">
          <CategoryChip name={article.category.name} slug={article.category.slug} color={article.category.color} />
          <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug">
            <Link href={href} className="group-hover:text-pulse">{article.title}</Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{date} · {article.readMinutes} min read</p>
        </div>
        {article.coverImage ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md">
            <Image src={article.coverImage} alt={article.coverAlt ?? ""} fill sizes="80px" className="object-cover" />
          </div>
        ) : null}
      </article>
    );
  }

  const isHero = variant === "hero";

  return (
    <article className={cn("group", isHero && "grid gap-5 md:grid-cols-2 md:items-center")}>
      {article.coverImage ? (
        <Link href={href} className={cn("relative block overflow-hidden rounded-lg", isHero ? "aspect-[16/10]" : "aspect-[16/9]")}>
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? ""}
            fill
            priority={priority}
            sizes={isHero ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {article.isBreaking ? (
            <Badge variant="pulse" className="absolute left-3 top-3">Breaking</Badge>
          ) : null}
        </Link>
      ) : null}
      <div className={cn(!isHero && "mt-3")}>
        <CategoryChip name={article.category.name} slug={article.category.slug} color={article.category.color} />
        <h3 className={cn("headline mt-2", isHero ? "text-3xl md:text-4xl" : "text-lg")}>
          <Link href={href} className="group-hover:text-pulse transition-colors">{article.title}</Link>
        </h3>
        <p className={cn("article-body mt-2 text-muted-foreground", isHero ? "line-clamp-3" : "line-clamp-2 text-sm")}>
          {article.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{article.author.name}</span>
          <span>{date}</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" /> {formatNumber(article.viewCount)}
          </span>
        </div>
      </div>
    </article>
  );
}

function CategoryChip({ name, slug, color }: { name: string; slug: string; color: string | null }) {
  return (
    <Link
      href={`/category/${slug}`}
      className="kicker inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color ?? "var(--pulse)" }} aria-hidden />
      {name}
    </Link>
  );
}
