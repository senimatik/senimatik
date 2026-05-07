import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, requireRole } from "./lib/auth";

// Get or create user on first login
// Called from UserContext after wallet connects
export const getOrCreate = mutation({
  args: {
    walletAddress: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity?.tokenIdentifier;

    // If authenticated, check for existing record by tokenIdentifier first
    if (tokenIdentifier) {
      const callerRecord = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
        .first();

      if (callerRecord) {
        if (email && callerRecord.email !== email) {
          await ctx.db.patch(callerRecord._id, { email });
          return await ctx.db.get(callerRecord._id);
        }
        return callerRecord;
      }
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", walletAddress))
      .first();

    if (existing) {
      const patch: Record<string, string> = {};
      // Only link tokenIdentifier if the record has none — prevents a different
      // authenticated caller from claiming another user's wallet and role
      if (tokenIdentifier && !existing.tokenIdentifier) {
        patch.tokenIdentifier = tokenIdentifier;
      }
      if (email && existing.email !== email) {
        patch.email = email;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
        return await ctx.db.get(existing._id);
      }
      return existing;
    }

    const userId = await ctx.db.insert("users", {
      walletAddress,
      tokenIdentifier,
      email,
      role: "user",
      createdAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});

// Get the currently authenticated user's own data
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUser(ctx);
  },
});

// Get shipping profile for the authenticated buyer (for PurchaseModal)
export const getShippingProfile = query({
  args: {},
  returns: v.union(
    v.object({
      phone: v.optional(v.string()),
      shippingAddress: v.optional(v.object({
        fullName: v.string(),
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
        phone: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);

    if (!user) return null;

    return {
      phone: user.phone,
      shippingAddress: user.shippingAddress,
    };
  },
});

// Get user by wallet address (public, minimal info — no role exposed)
export const getByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", walletAddress)
      )
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      socialUrl: user.socialUrl,
      createdAt: user.createdAt,
    };
  },
});

// Returns only the role for a wallet — used by /api/auth route handler.
// Returns minimal data (role only) to limit exposure. The route handler
// is the security boundary (JWT verified via jose before this is called).
export const getByWalletWithRole = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, { walletAddress }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) =>
        q.eq("walletAddress", walletAddress)
      )
      .first();

    if (!user) return null;
    return { role: user.role };
  },
});

// List all users (admin+, server-verified)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return await ctx.db.query("users").order("desc").take(500);
  },
});

// Update the authenticated user's own profile
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    socialUrl: v.optional(v.string()),
    shippingAddress: v.optional(v.object({
      fullName: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.string(),
    })),
  },
  handler: async (ctx, { displayName, avatarUrl, bio, socialUrl, shippingAddress }) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new Error("Authentication required");

    const patch: Record<string, unknown> = {};

    if (displayName !== undefined) {
      if (displayName.length > 50) throw new Error("Display name must be 50 characters or less");
      if (displayName.trim().length < 1) throw new Error("Display name cannot be empty");
      patch.displayName = displayName.trim();
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl.trim()) {
        // Allow R2 keys scoped to user's wallet or external HTTPS URLs
        if (avatarUrl.startsWith("profiles/")) {
          // R2 key must belong to authenticated user's wallet
          const expectedPrefix = `profiles/${user.walletAddress}/`;
          if (!avatarUrl.startsWith(expectedPrefix)) {
            throw new Error("Avatar must belong to your wallet");
          }
          patch.avatarUrl = avatarUrl;
        } else {
          let parsed: URL;
          try {
            parsed = new URL(avatarUrl);
          } catch {
            throw new Error("Avatar URL must be a valid URL");
          }
          if (parsed.protocol !== "https:") throw new Error("Avatar URL must use HTTPS");
          patch.avatarUrl = avatarUrl;
        }
      } else {
        patch.avatarUrl = "";
      }
    }

    if (bio !== undefined) {
      if (bio.length > 500) throw new Error("Bio must be 500 characters or less");
      patch.bio = bio.trim();
    }

    if (socialUrl !== undefined) {
      if (socialUrl.trim()) {
        let parsed: URL;
        try {
          parsed = new URL(socialUrl);
        } catch {
          throw new Error("Social URL must be a valid URL");
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("Social URL must use HTTP or HTTPS");
        }
        patch.socialUrl = socialUrl.trim();
      } else {
        patch.socialUrl = "";
      }
    }

    if (shippingAddress !== undefined) {
      const addr = shippingAddress;
      for (const [key, val] of Object.entries(addr)) {
        if (!val.trim()) throw new Error(`Shipping address ${key} is required`);
      }
      patch.shippingAddress = {
        fullName: addr.fullName.trim(),
        street: addr.street.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        zipCode: addr.zipCode.trim(),
        country: addr.country.trim(),
        phone: addr.phone.trim(),
      };
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }

    return await ctx.db.get(user._id);
  },
});

// Update a user's role (admin+, server-verified)
export const updateRole = mutation({
  args: {
    targetUserId: v.id("users"),
    newRole: v.union(
      v.literal("user"),
      v.literal("creator"),
      v.literal("admin"),
      v.literal("super_admin")
    ),
  },
  handler: async (ctx, { targetUserId, newRole }) => {
    const caller = await requireRole(ctx, "admin");

    // Prevent self-escalation/demotion
    if (caller._id === targetUserId) {
      throw new Error("Cannot change your own role");
    }

    // Only super_admin can assign/remove admin or super_admin roles
    if (
      (newRole === "admin" || newRole === "super_admin") &&
      caller.role !== "super_admin"
    ) {
      throw new Error("Only super_admin can assign admin roles");
    }

    // Prevent admin from demoting another admin/super_admin
    const target = await ctx.db.get(targetUserId);
    if (!target) throw new Error("Target user not found");
    if (
      (target.role === "admin" || target.role === "super_admin") &&
      caller.role !== "super_admin"
    ) {
      throw new Error("Only super_admin can modify admin roles");
    }

    await ctx.db.patch(targetUserId, { role: newRole });
    return await ctx.db.get(targetUserId);
  },
});
