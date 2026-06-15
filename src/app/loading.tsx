import { PulseMark } from "@/components/layout/pulse-mark";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <PulseMark className="h-8 w-14 text-pulse" animated />
        <p className="kicker text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
