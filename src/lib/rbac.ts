import type { Role } from "@prisma/client";

// Hierarchy: higher number = more privilege.
const ROLE_LEVEL: Record<Role, number> = {
  READER: 0,
  JOURNALIST: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export const hasRole = (userRole: Role, minimum: Role): boolean =>
  ROLE_LEVEL[userRole] >= ROLE_LEVEL[minimum];

export const STAFF_ROLES: Role[] = ["JOURNALIST", "EDITOR", "ADMIN"];
