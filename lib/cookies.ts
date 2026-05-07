// Two cookies exist for role:
// - "senimatik_role" (HttpOnly, set by /api/auth) — read by middleware for route protection
// - "senimatik_role_hint" (client-side, below) — read by Navbar for instant UI rendering
// They are intentionally separate to prevent client-side cookie from shadowing the secure one.
export type UserRole = "user" | "creator" | "admin" | "super_admin";

export function setRoleCookie(role: UserRole) {
  document.cookie = `senimatik_role_hint=${role}; path=/; SameSite=Strict; max-age=${60 * 60 * 24 * 30}`;
}

export function getRoleCookie(): UserRole | null {
  const match = document.cookie.match(/(?:^|; )senimatik_role_hint=([^;]*)/);
  const value = match?.[1];
  if (value === "user" || value === "creator" || value === "admin" || value === "super_admin") {
    return value;
  }
  return null;
}

export function clearRoleCookie() {
  document.cookie = "senimatik_role_hint=; path=/; max-age=0; SameSite=Strict";
}
