"use server";

import { z } from "zod";
import { db } from "@/server/db";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export interface NewsletterState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { unsubscribedAt: null },
    create: { email: parsed.data.email, isConfirmed: true, confirmedAt: new Date() },
  });

  return { status: "success", message: "You are in. The next briefing lands in your inbox." };
}
