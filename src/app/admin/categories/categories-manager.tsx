"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
  id?: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
}

const EMPTY: FormState = { name: "", description: "", color: "#D6202B", sortOrder: 0 };

export function CategoriesManager() {
  const utils = api.useUtils();
  const categories = api.category.listWithCounts.useQuery();

  const [form, setForm] = useState<FormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const invalidate = () => utils.category.listWithCounts.invalidate();

  const create = api.category.create.useMutation({
    onSuccess: () => {
      toast.success("Category created");
      setForm(null);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = api.category.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated");
      setForm(null);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = api.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleteTarget(null);
      void invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = create.isPending || update.isPending;

  function submit() {
    if (!form) return;
    const payload = {
      name: form.name,
      description: form.description || undefined,
      color: form.color || undefined,
      sortOrder: form.sortOrder,
    };
    if (form.id) update.mutate({ id: form.id, ...payload });
    else create.mutate(payload);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="headline text-2xl font-black tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Sections of the site. Categories with articles can&apos;t be deleted.
          </p>
        </div>
        <Button variant="pulse" onClick={() => setForm({ ...EMPTY })}>
          <PlusCircle className="size-4" /> New category
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Articles</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (
              (categories.data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: c.color ?? "var(--color-pulse)" }}
                      />
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {c.slug}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-sm tabular-nums">
                    {c._count.articles}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{c.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${c.name}`}
                        onClick={() =>
                          setForm({
                            id: c.id,
                            name: c.name,
                            description: c.description ?? "",
                            color: c.color ?? "#D6202B",
                            sortOrder: c.sortOrder,
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. True Crime"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-color">Accent color</Label>
                  <Input
                    id="cat-color"
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-9 p-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Sort order</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button
              variant="pulse"
              disabled={!form || form.name.trim().length < 2 || pending}
              onClick={submit}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {form?.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>
              This only works if no articles are filed under it.
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
