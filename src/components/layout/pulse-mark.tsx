import { cn } from "@/lib/utils";

/** Signature mark: the EKG pulse line. Used in masthead, breaking banner, and section ticks. */
export function PulseMark({
  className,
  animated = false,
  ...props
}: React.SVGProps<SVGSVGElement> & { animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 24" fill="none" aria-hidden="true" className={cn("h-5 w-12", className)} {...props}>
      <path
        d="M0 12 H16 L22 12 L27 3 L33 21 L38 8 L42 12 H64"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={animated ? "pulse-line" : undefined}
      />
    </svg>
  );
}
