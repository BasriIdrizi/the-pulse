import Link from "next/link";
import { PulseMark } from "./pulse-mark";

interface Props {
  article: { title: string; slug: string } | null;
}

export function BreakingBanner({ article }: Props) {
  if (!article) return null;
  return (
    <Link
      href={`/article/${article.slug}`}
      className="block bg-pulse text-pulse-foreground transition-opacity hover:opacity-95"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        <PulseMark animated className="h-4 w-10 shrink-0" />
        <span className="kicker shrink-0">Breaking</span>
        <span className="truncate text-sm font-semibold">{article.title}</span>
      </div>
    </Link>
  );
}
