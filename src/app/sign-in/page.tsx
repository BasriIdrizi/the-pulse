import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/server/auth";
import { PulseMark } from "@/components/layout/pulse-mark";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to The Pulse newsroom.",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <PulseMark className="h-6 w-10 text-pulse" />
          <span className="headline text-2xl font-black tracking-tight">The Pulse</span>
        </Link>
        <Suspense>
          <SignInForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Staff access only. Reader accounts are created by an administrator.
        </p>
      </div>
    </main>
  );
}
