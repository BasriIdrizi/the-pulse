"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = api.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <form
      className="max-w-md space-y-4 rounded-lg border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (newPassword !== confirm) {
          toast.error("New passwords don't match");
          return;
        }
        change.mutate({ currentPassword, newPassword });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          At least 10 characters, with an uppercase letter and a number.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={change.isPending}>
        {change.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
