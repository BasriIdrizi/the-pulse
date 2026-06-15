import { Skeleton } from "@/components/ui/skeleton";

export function ArticleCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[16/9] w-full rounded-lg" />
      <Skeleton className="mt-3 h-3 w-20" />
      <Skeleton className="mt-2 h-5 w-full" />
      <Skeleton className="mt-1 h-5 w-3/4" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}
