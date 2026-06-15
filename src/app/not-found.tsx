import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PulseMark } from "@/components/layout/pulse-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <PulseMark className="mx-auto h-7 w-12 text-pulse" />
        <p className="kicker mt-6 text-xs text-pulse">404 — flatline</p>
        <h1 className="headline mt-2 text-3xl font-black tracking-tight">
          This story doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for was moved, unpublished, or never filed.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="pulse" asChild>
            <Link href="/">Front page</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">Search the archive</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
