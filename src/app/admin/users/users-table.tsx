"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, KeyRound } from "lucide-react";
import { Role } from "@prisma/client";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL = "__all__";

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>(ALL);

  const utils = api.useUtils();
  const users = api.user.list.useQuery({
    query: search || undefined,
    role: role === ALL ? undefined : (role as Role),
  });

  const setUserRole = api.user.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      void utils.user.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const setActive = api.user.setActive.useMutation({
    onSuccess: () => {
      toast.success("Account status updated");
      void utils.user.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="headline text-2xl font-black tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and access. You can&apos;t change your own role or status here.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(query)}
            placeholder="Search name or email…"
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All roles</SelectItem>
            {Object.values(Role).map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setSearch(query)}>
          Apply
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Articles</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (
              (users.data ?? []).map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf ? <Badge className="ml-2" variant="outline">You</Badge> : null}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        disabled={isSelf || setUserRole.isPending}
                        onValueChange={(value) =>
                          setUserRole.mutate({ id: u.id, role: value as Role })
                        }
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(Role).map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-sm tabular-nums">
                      {u._count.articles}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.isActive}
                        disabled={isSelf || setActive.isPending}
                        onCheckedChange={(checked) =>
                          setActive.mutate({ id: u.id, isActive: checked })
                        }
                        aria-label={`Toggle ${u.name}'s account`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ResetPasswordDialog userId={u.id} userName={u.name} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Dialog for an admin to create a new user with a chosen role and password. */
function CreateUserDialog() {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.READER);

  const create = api.user.adminCreate.useMutation({
    onSuccess: () => {
      toast.success("User created");
      void utils.user.list.invalidate();
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole(Role.READER);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 size-4" />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Add a staff member or reader account. They can sign in immediately with this password.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, email, password, role });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              At least 10 characters, with an uppercase letter and a number.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Role).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Per-row dialog for an admin to reset a user's password. */
function ResetPasswordDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const reset = api.user.adminResetPassword.useMutation({
    onSuccess: () => {
      toast.success(`Password reset for ${userName}`);
      setOpen(false);
      setNewPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="mr-2 size-3.5" />
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {userName}. They&apos;ll use it the next time they sign in.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            reset.mutate({ id: userId, newPassword });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={`reset-${userId}`}>New password</Label>
            <Input
              id={`reset-${userId}`}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              At least 10 characters, with an uppercase letter and a number.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Reset password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
