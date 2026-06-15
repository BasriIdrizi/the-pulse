import type { Metadata } from "next";
import { auth } from "@/server/auth";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const session = await auth();
  return <UsersTable currentUserId={session?.user?.id ?? ""} />;
}
