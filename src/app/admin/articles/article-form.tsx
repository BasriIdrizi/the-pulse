"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { api } from "@/trpc/react";
import { slugify } from "@/lib/utils";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface ArticleFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  categoryId: string;
  tagIds: string[];
  isFeatured: boolean;
  isBreaking: boolean;
  isTrending: boolean;
}

const EMPTY: ArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  coverAlt: "",
  categoryId: "",
  tagIds: [],
  isFeatured: false,
  isBreaking: false,
  isTrending: false,
};

interface Props {
  mode: "create" | "edit";
  articleId?: string;
  initial?: Partial<ArticleFormValues>;
  isEditor: boolean;
}

export function ArticleForm({ mode, articleId, initial, isEditor }: Props) {
  const router = useRouter();
  const utils = api.useUtils();

  const [values, setValues] = useState<ArticleFormValues>({ ...EMPTY, ...initial });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [revisionNote, setRevisionNote] = useState("");
  const [newTag, setNewTag] = useState("");

  const categories = api.category.list.useQuery();
  const tags = api.tag.list.useQuery();

  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const create = api.article.create.useMutation({
    onSuccess: (created) => {
      toast.success("Draft saved");
      router.push(`/admin/articles/${created.id}/edit`);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = api.article.update.useMutation({
    onSuccess: () => {
      toast.success("Changes saved");
      setRevisionNote("");
      void utils.article.revisions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const upsertTag = api.tag.upsert.useMutation({
    onSuccess: (tag) => {
      void tags.refetch();
      set("tagIds", [...new Set([...values.tagIds, tag.id])]);
      setNewTag("");
    },
    onError: (e) => toast.error(e.message),
  });

  const revisions = api.article.revisions.useQuery(
    { articleId: articleId ?? "" },
    { enabled: mode === "edit" && Boolean(articleId) },
  );

  const restore = api.article.restoreRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision restored — reload to see it in the editor");
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = create.isPending || update.isPending;

  const payload = useMemo(
    () => ({
      ...values,
      coverImage: values.coverImage || "",
      coverAlt: values.coverAlt || undefined,
    }),
    [values],
  );

  function handleSubmit() {
    if (!values.categoryId) {
      toast.error("Pick a category first.");
      return;
    }
    if (mode === "create") {
      create.mutate(payload);
    } else if (articleId) {
      update.mutate({ id: articleId, revisionNote: revisionNote || undefined, ...payload });
    }
  }

  function toggleTag(id: string) {
    set(
      "tagIds",
      values.tagIds.includes(id)
        ? values.tagIds.filter((t) => t !== id)
        : values.tagIds.length < 10
          ? [...values.tagIds, id]
          : values.tagIds,
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Headline</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
            placeholder="A headline readers can't scroll past"
            className="headline text-lg font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }}
            placeholder="url-friendly-slug"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={values.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="One or two sentences shown in cards and search results (20–400 chars)."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Body</Label>
          <RichTextEditor value={values.content} onChange={(html) => set("content", html)} />
        </div>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="headline text-sm">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={values.categoryId || undefined}
                onValueChange={(v) => set("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cover">Cover image URL</Label>
              <Input
                id="cover"
                type="url"
                value={values.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coverAlt">Cover alt text</Label>
              <Input
                id="coverAlt"
                value={values.coverAlt}
                onChange={(e) => set("coverAlt", e.target.value)}
                placeholder="Describe the image"
              />
            </div>

            {isEditor ? (
              <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                <p className="kicker text-[11px]">Editor flags</p>
                {(
                  [
                    ["isFeatured", "Featured (hero slot)"],
                    ["isBreaking", "Breaking news"],
                    ["isTrending", "Trending"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm font-normal">
                      {label}
                    </Label>
                    <Switch
                      id={key}
                      checked={values[key]}
                      onCheckedChange={(checked) => set(key, checked)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Featured, breaking, and trending flags are set by editors.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="headline text-sm">Tags ({values.tagIds.length}/10)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(tags.data ?? []).map((t) => (
                <button key={t.id} type="button" onClick={() => toggleTag(t.id)}>
                  <Badge variant={values.tagIds.includes(t.id) ? "pulse" : "outline"}>
                    {t.name}
                  </Badge>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim().length >= 2) {
                    e.preventDefault();
                    upsertTag.mutate({ name: newTag.trim() });
                  }
                }}
                placeholder="New tag…"
              />
              <Button
                type="button"
                variant="outline"
                disabled={newTag.trim().length < 2 || upsertTag.isPending}
                onClick={() => upsertTag.mutate({ name: newTag.trim() })}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {mode === "edit" ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="headline flex items-center gap-1.5 text-sm">
                <History className="size-4" /> Revision history
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="revisionNote">Note for this save</Label>
                <Input
                  id="revisionNote"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="e.g. tightened the lede"
                />
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {(revisions.data ?? []).map((r) => (
                  <li key={r.id} className="rounded-md border p-2 text-xs">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()} · {r.editor.name ?? "Staff"}
                      {r.note ? ` — ${r.note}` : ""}
                    </p>
                    {isEditor ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 px-2 text-xs"
                        disabled={restore.isPending}
                        onClick={() => restore.mutate({ revisionId: r.id })}
                      >
                        <RotateCcw className="size-3" /> Restore
                      </Button>
                    ) : null}
                  </li>
                ))}
                {revisions.data?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No revisions yet.</p>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Button variant="pulse" className="w-full" disabled={pending} onClick={handleSubmit}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {mode === "create" ? "Save draft" : "Save changes"}
        </Button>
        {mode === "create" ? (
          <p className="text-center text-xs text-muted-foreground">
            New stories are saved as drafts. Publish from the articles list.
          </p>
        ) : null}
      </div>
    </div>
  );
}
