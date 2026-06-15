import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-12 w-full" />
      <Skeleton className="mt-2 h-12 w-2/3" />
      <Skeleton className="mt-6 h-6 w-72" />
      <Skeleton className="mt-8 aspect-[16/9] w-full rounded-lg" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
