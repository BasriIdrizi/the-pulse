import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow cover images from any HTTPS source so editors can paste URLs from
    // any stock site without a config change + rebuild each time.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  output: "standalone",
};

export default config;
