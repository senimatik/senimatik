import { NextResponse, type NextRequest } from "next/server";

type Role = "user" | "creator" | "admin" | "super_admin";

const ROLE_LEVEL: Record<Role, number> = {
  user: 0,
  creator: 1,
  admin: 2,
  super_admin: 3,
};

// Routes and their minimum required role
const PROTECTED_ROUTES: { path: string; minRole: Role }[] = [
  { path: "/apply", minRole: "user" },
  { path: "/purchase", minRole: "user" },
  { path: "/settings", minRole: "user" },
  { path: "/create", minRole: "creator" },
  { path: "/onboarding", minRole: "creator" },
  { path: "/studio", minRole: "creator" },
  { path: "/admin", minRole: "admin" },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matched = PROTECTED_ROUTES.find(
    (route) => pathname === route.path || pathname.startsWith(route.path + "/")
  );

  if (!matched) return NextResponse.next();

  const rawRole = request.cookies.get("senimatik_role")?.value;
  const role: Role | undefined = rawRole && rawRole in ROLE_LEVEL ? (rawRole as Role) : undefined;

  // Hint cookie (client-settable) only used to prevent 401 during auth restoration
  // Never used for role checks - role comes only from HttpOnly senimatik_role cookie
  const hasHint = /senimatik_role_hint=/.test(request.headers.get("cookie") || "");

  // No valid role cookie and no hint = not authenticated
  if (!role && !hasHint) {
    return NextResponse.redirect(new URL("/401", request.url));
  }

  // Role check uses only HttpOnly cookie (secure source of truth)
  // If no role but has hint, allow through (auth restoring) - Convex will enforce access control
  if (role && ROLE_LEVEL[role] < ROLE_LEVEL[matched.minRole]) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/apply/:path*",
    "/purchase/:path*",
    "/settings/:path*",
    "/create/:path*",
    "/onboarding/:path*",
    "/studio/:path*",
    "/admin/:path*",
  ],
};
