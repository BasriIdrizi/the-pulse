import type { Metadata } from "next";
import { NewsletterManager } from "./newsletter-manager";

export const metadata: Metadata = { title: "Newsletter" };

export default function AdminNewsletterPage() {
  return <NewsletterManager />;
}
