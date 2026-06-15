import Link from "next/link";
import { PulseMark } from "./pulse-mark";
import { NewsletterForm } from "@/features/newsletter/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PulseMark className="h-5 w-12 text-pulse" />
            <span className="headline text-xl">The Pulse</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The stories America is talking about — viral news, true crime, and the strange corners of the country, reported straight.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          <Link className="text-muted-foreground hover:text-foreground" href="/search">Search</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/category/us-news">U.S. News</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/category/true-crime">True Crime</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/category/weird-news">Weird News</Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/sign-in">Staff sign in</Link>
        </nav>
        <div>
          <h2 className="kicker mb-3 text-pulse">The Daily Pulse</h2>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Pulse. All rights reserved.
      </div>
    </footer>
  );
}
