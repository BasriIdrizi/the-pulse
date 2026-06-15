import Link from "next/link";
import { Search } from "lucide-react";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { safeBuildQuery } from "@/features/articles/queries";
import { hasRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { PulseMark } from "./pulse-mark";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const [session, categories] = await Promise.all([
    auth(),
    safeBuildQuery(
      () =>
        db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true }, take: 6 }),
      [] as { name: string; slug: string }[],
    ),
  ]);

  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="The Pulse — home">
          <PulseMark className="h-6 w-14 text-pulse" />
          <span className="headline text-2xl">The Pulse</span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="kicker rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Search articles">
            <Link href="/search">
              <Search className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
          {user ? (
            <UserMenu
              name={user.name ?? "Account"}
              image={user.image ?? undefined}
              isStaff={hasRole(user.role, "JOURNALIST")}
            />
          ) : (
            <Button variant="pulse" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}