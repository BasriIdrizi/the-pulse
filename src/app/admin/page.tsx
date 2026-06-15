import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, FileText, CalendarClock, MessageSquare, Users as UsersIcon, PenLine } from "lucide-react";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { api } from "@/trpc/server";
import { formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryChart } from "./category-chart";

export const metadata: Metadata = { title: "Overview" };

const stats = [
  { key: "published", label: "Published", icon: FileText },
  { key: "drafts", label: "Drafts", icon: PenLine },
  { key: "scheduled", label: "Scheduled", icon: CalendarClock },
  { key: "totalViews", label: "Total views", icon: Eye },
  { key: "commentsLast30", label: "Comments (30d)", icon: MessageSquare },
  { key: "users", label: "Users", icon: UsersIcon },
] as const;

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.role, "EDITOR")) {
    // Journalists land on their article list instead.
    redirect("/admin/articles");
  }

  const overview = await api.analytics.overview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl font-black tracking-tight">Newsroom overview</h1>
        <p className="text-sm text-muted-foreground">What&apos;s moving across The Pulse.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-pulse/10 p-2 text-pulse">
                <s.icon className="size-4" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">
                  {formatNumber(overview[s.key])}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="headline text-base">Published stories by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={overview.byCategory} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="headline text-base">Most-read stories</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {overview.topArticles.map((a, i) => (
                <li key={a.id} className="flex items-baseline gap-3">
                  <span className="headline w-6 shrink-0 text-lg font-black text-pulse/60">
                    {i + 1}
                  </span>
                  <Link
                    href={`/article/${a.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                  >
                    {a.title}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatNumber(a.viewCount)} views
                  </span>
                </li>
              ))}
              {overview.topArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No published stories yet.</p>
              ) : null}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
