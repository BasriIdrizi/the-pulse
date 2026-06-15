"use client";

import { useState } from "react";
import { Download, Loader2, MailCheck, MailMinus, TrendingUp } from "lucide-react";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

export function NewsletterManager() {
  const [activeOnly, setActiveOnly] = useState(true);
  const stats = api.newsletter.stats.useQuery();
  const subscribers = api.newsletter.list.useQuery({ activeOnly });

  function exportCsv() {
    const rows = subscribers.data ?? [];
    const header = "email,subscribed_at,unsubscribed_at";
    const body = rows
      .map(
        (s) =>
          `${s.email},${new Date(s.createdAt).toISOString()},${
            s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : ""
          }`,
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pulse-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: "Active subscribers", value: stats.data?.active, icon: MailCheck },
    { label: "Total ever", value: stats.data?.total, icon: MailMinus },
    { label: "New in last 30 days", value: stats.data?.last30, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="headline text-2xl font-black tracking-tight">Newsletter</h1>
        <p className="text-sm text-muted-foreground">The Pulse daily briefing audience.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-pulse/10 p-2 text-pulse">
                <c.icon className="size-4" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">
                  {c.value === undefined ? "—" : formatNumber(c.value)}
                </p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="active-only" checked={activeOnly} onCheckedChange={setActiveOnly} />
          <Label htmlFor="active-only" className="text-sm font-normal">
            Active only
          </Label>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!subscribers.data?.length}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Subscribed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (subscribers.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            ) : (
              (subscribers.data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.unsubscribedAt ? "secondary" : "pulse"}>
                      {s.unsubscribedAt ? "Unsubscribed" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
