import { PulseMark } from "@/components/layout/pulse-mark";

export function SectionHeader({ title, accent }: { title: string; accent?: string | null }) {
  return (
    <div className="mb-6 flex items-center gap-3 border-b pb-3">
      <PulseMark className="h-4 w-9" style={{ color: accent ?? "var(--pulse)" } as React.CSSProperties} />
      <h2 className="kicker text-base tracking-[0.18em]">{title}</h2>
    </div>
  );
}
