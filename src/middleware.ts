import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/rbac";

// Route-level RBAC. tRPC procedures enforce the same rules at the API layer.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signIn);
    }
    // Admin-only sections inside the dashboard.
    const adminOnly = ["/admin/users", "/admin/categories"].some((p) => pathname.startsWith(p));
    const required = adminOnly ? "ADMIN" : "JOURNALIST";
    if (!hasRole(user.role, required)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
