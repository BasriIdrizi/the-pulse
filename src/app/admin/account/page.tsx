import type { Metadata } from "next";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="headline text-2xl font-black tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Update the password for your own account.
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
