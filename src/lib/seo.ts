import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "The Pulse";

/**
 * Default share image used when a page has no image of its own (homepage,
 * articles without a cover, etc.). Place a 1200x630 PNG at `public/og-default.png`.
 */
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

/** Publisher logo for structured data. Place a logo at `public/logo.png`. */
const SITE_LOGO = `${SITE_URL}/logo.png`;

interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  /** Set true for pages that shouldn't be indexed (search results, etc.). */
  noindex?: boolean;
}

export function buildMetadata(input: SeoInput): Metadata {
  const url = `${SITE_URL}${input.path}`;
  const image = input.image ?? DEFAULT_OG_IMAGE;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: input.type ?? "website",
      images: [{ url: image, width: 1200, height: 630 }],
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, authors: input.authors }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

/** Publisher Organization block, reused by the NewsArticle schema. */
export function publisherJsonLd() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    logo: { "@type": "ImageObject", url: SITE_LOGO },
  };
}

/** Site-wide Organization structured data for the homepage. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
  };
}

/** WebSite structured data — enables the Google sitelinks search box. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export { SITE_URL, SITE_NAME, SITE_LOGO, DEFAULT_OG_IMAGE };
