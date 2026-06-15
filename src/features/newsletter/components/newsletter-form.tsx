"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeToNewsletter, type NewsletterState } from "@/features/newsletter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <div>
      <form action={formAction} className={cn("flex gap-2", compact ? "flex-col sm:flex-row" : "")}>
        <Input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1"
        />
        <Button type="submit" variant="pulse" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Subscribe
        </Button>
      </form>
      {state.status !== "idle" ? (
        <p
          role="status"
          className={cn("mt-2 text-sm", state.status === "success" ? "text-foreground" : "text-destructive")}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
