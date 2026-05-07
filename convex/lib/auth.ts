import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

type Role = "user" | "creator" | "admin" | "super_admin";

const ROLE_HIERARCHY: Record<Role, number> = {
  user: 0,
  creator: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * Get the authenticated user from the JWT identity verified by Convex.
 * Returns the user doc or null if not authenticated / user not found.
 */
export async function getAuthUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Look up by tokenIdentifier first (fast, indexed)
  const byToken = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (byToken) return byToken;

  // Fallback: look up by wallet address (subject = walletAddress from our SIWS JWT)
  const walletAddress = identity.subject;
  if (!walletAddress) return null;

  const byWallet = await ctx.db
    .query("users")
    .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
    .first();

  return byWallet ?? null;
}

/**
 * Require an authenticated user with at least the given role.
 * Optionally verify wallet ownership matches the provided walletAddress.
 * Throws if not authenticated, insufficient permissions, or wallet mismatch.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  minRole: Role,
  expectedWalletAddress?: string
): Promise<Doc<"users">> {
  const user = await getAuthUser(ctx);
  if (!user) throw new ConvexError("Authentication required");

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minRole];

  if (userLevel < requiredLevel) {
    throw new ConvexError(`Requires ${minRole} role or higher`);
  }

  // Verify wallet ownership if provided
  if (expectedWalletAddress && user.walletAddress !== expectedWalletAddress) {
    throw new ConvexError("Wallet address mismatch");
  }

  return user;
}
