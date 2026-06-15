"use client";

import Script from "next/script";

interface AdWidgetProps {
  /**
   * The container element id AdsKeeper expects. This is the `id` of the
   * empty <div> in the embed snippet your AdsKeeper dashboard gives you
   * (e.g. "M123456ScriptRootC789012").
   */
  widgetId?: string;
  /**
   * The async loader URL from the same embed snippet
   * (e.g. "https://jsc.adskeeper.com/p/u/your-site.789012.js").
   */
  scriptSrc?: string;
  /** Optional wrapper classes for spacing/centering. */
  className?: string;
}

/**
 * Renders a single AdsKeeper native-ad placement.
 *
 * AdsKeeper widgets are just an empty container <div> plus an async script
 * that finds that div by id and injects the ad. In the App Router we load
 * that script with next/script (strategy="afterInteractive") instead of
 * putting it in <head>, so it never blocks first paint.
 *
 * Behaviour:
 *   - Production + real widget configured  -> loads the real AdsKeeper ad.
 *   - Otherwise (dev, or no IDs set yet)    -> shows a demo placeholder so
 *     you can see where the unit sits and how big it is.
 */
export function AdWidget({ widgetId, scriptSrc, className }: AdWidgetProps) {
  const wrapper = className ?? "my-10";
  const isConfigured = Boolean(widgetId && scriptSrc);
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && isConfigured) {
    return (
      <aside aria-label="Advertisement" className={`${wrapper} flex justify-center`}>
        <div id={widgetId} />
        <Script
          id={`adskeeper-${widgetId}`}
          src={scriptSrc}
          strategy="afterInteractive"
        />
      </aside>
    );
  }

  return <AdPlaceholder className={wrapper} />;
}

/** A non-clickable mock of a native-ad unit, used in dev / before setup. */
function AdPlaceholder({ className }: { className?: string }) {
  const items = [
    { tag: "Health", title: "Doctors Say This Simple Habit Changes Everything" },
    { tag: "Finance", title: "Americans Are Switching to This New Savings Trick" },
    { tag: "Lifestyle", title: "The One Thing People Wish They Knew Sooner" },
  ];

  return (
    <aside
      aria-label="Advertisement (demo placeholder)"
      className={`${className} rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4`}
    >
      <p className="kicker mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        Sponsored · Ad placeholder
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="group">
            <div className="aspect-[16/10] w-full rounded-md bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/5" />
            <span className="mt-2 block text-[11px] font-semibold uppercase text-pulse">
              {it.tag}
            </span>
            <p className="mt-1 text-sm font-medium leading-snug text-foreground">
              {it.title}
            </p>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              Sponsored
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
