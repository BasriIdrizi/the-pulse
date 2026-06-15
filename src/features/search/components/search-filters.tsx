"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

interface Option {
  label: string;
  value: string;
}

interface Props {
  categories: Option[];
  tags: Option[];
  authors: Option[];
}

export function SearchFilters({ categories, tags, authors }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? ALL);
  const [tag, setTag] = useState(params.get("tag") ?? ALL);
  const [author, setAuthor] = useState(params.get("author") ?? ALL);
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  const apply = useCallback(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (category !== ALL) next.set("category", category);
    if (tag !== ALL) next.set("tag", tag);
    if (author !== ALL) next.set("author", author);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    router.push(`/search?${next.toString()}`);
  }, [query, category, tag, author, from, to, router]);

  const reset = () => {
    setQuery("");
    setCategory(ALL);
    setTag(ALL);
    setAuthor(ALL);
    setFrom("");
    setTo("");
    router.push("/search");
  };

  const hasFilters =
    Boolean(params.get("q")) ||
    Boolean(params.get("category")) ||
    Boolean(params.get("tag")) ||
    Boolean(params.get("author")) ||
    Boolean(params.get("from")) ||
    Boolean(params.get("to"));

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Search headlines, stories, keywords…"
            className="pl-9"
            aria-label="Search articles"
          />
        </div>
        <Button variant="pulse" onClick={apply}>
          Search
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label className="kicker text-[11px]">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="kicker text-[11px]">Tag</Label>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="kicker text-[11px]">Author</Label>
          <Select value={author} onValueChange={setAuthor}>
            <SelectTrigger aria-label="Filter by author">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All authors</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="search-from" className="kicker text-[11px]">
            From
          </Label>
          <Input
            id="search-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="search-to" className="kicker text-[11px]">
            To
          </Label>
          <Input id="search-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-4" /> Clear all filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
