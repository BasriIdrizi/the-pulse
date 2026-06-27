"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  ImageIcon,
  Mail,
  Newspaper,
  PenSquare,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export function AdminNav({
  isEditor,
  isAdmin,
  horizontal = false,
}: {
  isEditor: boolean;
  isAdmin: boolean;
  horizontal?: boolean;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    ...(isEditor
      ? [{ href: "/admin", label: "Overview", icon: BarChart3, exact: true }]
      : []),
    { href: "/admin/articles", label: "Articles", icon: Newspaper },
    { href: "/admin/articles/new", label: "New article", icon: PenSquare, exact: true },
    { href: "/admin/media", label: "Media", icon: ImageIcon },
    ...(isAdmin
      ? [
          { href: "/admin/categories", label: "Categories", icon: FolderTree },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
        ]
      : []),
    { href: "/admin/account", label: "Account", icon: UserCog },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/admin/articles")
      return pathname.startsWith("/admin/articles") && pathname !== "/admin/articles/new";
    return pathname.startsWith(item.href);
  };

  return (
    <nav
      className={cn(
        horizontal
          ? "flex gap-1 overflow-x-auto"
          : "flex flex-1 flex-col gap-0.5 p-2",
      )}
    >
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : isActive(item);
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              horizontal && "shrink-0 px-2.5 py-1.5",
              active
                ? "bg-pulse/10 text-pulse"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
