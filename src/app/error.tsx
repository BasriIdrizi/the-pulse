"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PulseMark } from "@/components/layout/pulse-mark";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <PulseMark className="mx-auto h-7 w-12 text-pulse" />
        <h1 className="headline mt-4 text-3xl font-black tracking-tight">
          We lost the signal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while loading this page. The newsroom has been notified
          {error.digest ? ` (ref: ${error.digest})` : ""}.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="pulse" onClick={reset}>
            Try again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Back to the front page</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
