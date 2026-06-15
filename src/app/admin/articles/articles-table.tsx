"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import type { ArticleStatus } from "@prisma/client";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";

const STATUS_FILTER = "__all__";

const statusVariant: Record<ArticleStatus, "default" | "secondary" | "pulse" | "signal" | "outline"> = {
  PUBLISHED: "pulse",
  DRAFT: "secondary",
  IN_REVIEW: "signal",
  SCHEDULED: "outline",
  ARCHIVED: "secondary",
};

export function ArticlesTable({
  isEditor,
}: {
  isEditor: boolean;
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(STATUS_FILTER);

  const utils = api.useUtils();
  const list = api.article.listForDashboard.useInfiniteQuery(
    {
      limit: 20,
      query: search || undefined,
      status: status === STATUS_FILTER ? undefined : (status as ArticleStatus),
    },
    { getNextPageParam: (last) => last.nextCursor },
  );

  const refresh = () => utils.article.listForDashboard.invalidate();

  const publish = api.article.publish.useMutation({
    onSuccess: () => {
      toast.success("Story published");
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublish = api.article.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Story unpublished");
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = api.article.delete.useMutation({
    onSuccess: () => {
      toast.success("Story deleted");
      setDeleteTarget(null);
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const schedule = api.article.schedule.useMutation({
    onSuccess: () => {
      toast.success("Story scheduled");
      setScheduleTarget(null);
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; title: string } | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="headline text-2xl font-black tracking-tight">Articles</h1>
          <p className="text-sm text-muted-foreground">
            {isEditor ? "Every story in the system." : "Your stories."}
          </p>
        </div>
        <Button variant="pulse" asChild>
          <Link href="/admin/articles/new">
            <PlusCircle className="size-4" /> New article
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(query)}
            placeholder="Filter by title…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_FILTER}>All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_REVIEW">In review</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setSearch(query)}>
          Apply
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              {isEditor ? <TableHead className="hidden lg:table-cell">Author</TableHead> : null}
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Views</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No stories found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-[320px]">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="block truncate font-medium hover:underline"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-0.5 flex gap-1">
                      {a.isBreaking ? <Badge variant="pulse">Breaking</Badge> : null}
                      {a.isFeatured ? <Badge variant="signal">Featured</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {a.category.name}
                  </TableCell>
                  {isEditor ? (
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {a.author.name}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Badge variant={statusVariant[a.status]}>{a.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-sm tabular-nums">
                    {formatNumber(a.viewCount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/articles/${a.id}/edit`}>
                            <Pencil className="size-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        {a.status === "PUBLISHED" ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/article/${a.slug}`} target="_blank">
                              <ExternalLink className="size-4" /> View live
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {isEditor ? (
                          <>
                            <DropdownMenuSeparator />
                            {a.status === "PUBLISHED" ? (
                              <DropdownMenuItem onClick={() => unpublish.mutate({ id: a.id })}>
                                Unpublish
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => publish.mutate({ id: a.id })}>
                                  Publish now
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setScheduleTarget({ id: a.id, title: a.title });
                                    setScheduleAt("");
                                  }}
                                >
                                  <CalendarClock className="size-4" /> Schedule…
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget({ id: a.id, title: a.title })}
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {list.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => void list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
          >
            {list.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this story?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” will be permanently removed, along with its revisions and
              comments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleteTarget && remove.mutate({ id: deleteTarget.id })}
            >
              {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog
        open={Boolean(scheduleTarget)}
        onOpenChange={(open) => !open && setScheduleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule publication</DialogTitle>
            <DialogDescription>
              “{scheduleTarget?.title}” will go live automatically at the chosen time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-at">Publish at</Label>
            <Input
              id="schedule-at"
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="pulse"
              disabled={!scheduleAt || schedule.isPending}
              onClick={() =>
                scheduleTarget &&
                schedule.mutate({ id: scheduleTarget.id, publishedAt: new Date(scheduleAt) })
              }
            >
              {schedule.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
