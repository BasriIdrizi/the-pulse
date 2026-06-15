"use client";

/* eslint-disable @next/next/no-img-element -- external media URLs of unknown origin */

import { useState } from "react";
import { toast } from "sonner";
import { Copy, FileVideo, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MediaManager({ isEditor }: { isEditor: boolean }) {
  const utils = api.useUtils();
  const media = api.media.list.useInfiniteQuery(
    {},
    { getNextPageParam: (last) => last.nextCursor },
  );

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [alt, setAlt] = useState("");

  const register = api.media.register.useMutation({
    onSuccess: () => {
      toast.success("Asset registered");
      setOpen(false);
      setUrl("");
      setFilename("");
      setAlt("");
      void utils.media.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = api.media.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset removed");
      void utils.media.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = media.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="headline text-2xl font-black tracking-tight">Media library</h1>
          <p className="text-sm text-muted-foreground">
            Registered assets. Paste a URL into any article&apos;s cover or body.
          </p>
        </div>
        <Button variant="pulse" onClick={() => setOpen(true)}>
          <PlusCircle className="size-4" /> Register asset
        </Button>
      </div>

      {media.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No assets yet. Register one by URL to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((m) => (
            <Card key={m.id} className="overflow-hidden py-0">
              <div className="relative aspect-video bg-muted">
                {m.type === "IMAGE" ? (
                  <img
                    src={m.url}
                    alt={m.alt ?? m.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <FileVideo className="size-8" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 p-3">
                <p className="truncate text-sm font-medium" title={m.filename}>
                  {m.filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.uploader.name ?? "Staff"} · {new Date(m.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(m.url);
                      toast.success("URL copied");
                    }}
                  >
                    <Copy className="size-3" /> Copy URL
                  </Button>
                  {isEditor ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      aria-label="Delete asset"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate({ id: m.id })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {media.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => void media.fetchNextPage()}
            disabled={media.isFetchingNextPage}
          >
            {media.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
            Load more
          </Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register asset by URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="media-url">Asset URL</Label>
              <Input
                id="media-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-name">Filename</Label>
              <Input
                id="media-name"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="hero-courthouse.jpg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="media-alt">Alt text</Label>
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="pulse"
              disabled={!url || !filename || register.isPending}
              onClick={() =>
                register.mutate({ url, filename, alt: alt || undefined, type: "IMAGE" })
              }
            >
              {register.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
