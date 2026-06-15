import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";
import { PulseMark } from "@/components/layout/pulse-mark";
import { AdminNav } from "./admin-nav";
import { UserMenu } from "@/components/layout/user-menu";

export const metadata: Metadata = {
  title: { template: "%s · Newsroom · The Pulse", default: "Newsroom · The Pulse" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/admin");
  if (!hasRole(session.user.role, "JOURNALIST")) redirect("/");

  const isAdmin = hasRole(session.user.role, "ADMIN");
  const isEditor = hasRole(session.user.role, "EDITOR");

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <PulseMark className="h-4 w-9 text-pulse" />
            <span className="headline text-sm font-black tracking-tight">Newsroom</span>
          </Link>
        </div>
        <AdminNav isEditor={isEditor} isAdmin={isAdmin} />
        <div className="border-t p-3 text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{session.user.name}</span>
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {session.user.role}
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b px-4">
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <PulseMark className="h-4 w-9 text-pulse" />
              <span className="headline text-sm font-black">Newsroom</span>
            </Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              View site →
            </Link>
            <UserMenu
              name={session.user.name ?? "Staff"}
              image={session.user.image ?? undefined}
              isStaff
            />
          </div>
        </header>
        <div className="border-b px-4 py-2 lg:hidden">
          <AdminNav isEditor={isEditor} isAdmin={isAdmin} horizontal />
        </div>
        <main className="flex-1 overflow-x-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
