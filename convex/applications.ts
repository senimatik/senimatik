import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUser, requireRole } from "./lib/auth";

// Submit a creator application (authenticated user only)
export const submit = mutation({
  args: {
    walletAddress: v.string(),
    portfolioLink: v.string(),
    twitterHandle: v.string(),
    artistStatement: v.string(),
  },
  returns: v.id("applications"),
  handler: async (ctx, { walletAddress, portfolioLink, twitterHandle, artistStatement }) => {
    // requireRole("user") would allow creator/admin too, so we use getAuthUser
    // and check the exact role to ensure only non-creator users can apply
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Authentication required");
    if (user.walletAddress !== walletAddress) {
      throw new ConvexError("Wallet address mismatch");
    }
    if (user.role !== "user") throw new ConvexError("Only users without creator status can apply.");

    // Input validation
    if (portfolioLink.length > 500) throw new ConvexError("Portfolio link is too long");
    if (twitterHandle.length > 50) throw new ConvexError("Twitter handle is too long");
    if (artistStatement.length > 2000) throw new ConvexError("Artist statement is too long");
    if (artistStatement.length < 50) throw new ConvexError("Artist statement must be at least 50 characters");

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(portfolioLink);
    } catch {
      throw new ConvexError("Portfolio link must be a valid URL");
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new ConvexError("Portfolio link must use https or http");
    }

    const cleanHandle = twitterHandle.startsWith("@") ? twitterHandle : `@${twitterHandle}`;
    if (!/^@[\w]{1,15}$/.test(cleanHandle)) {
      throw new ConvexError("Twitter handle must be a valid @username (1-15 alphanumeric characters)");
    }

    // Check for existing active application
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (existing && (existing.status === "submitted" || existing.status === "in_review")) {
      throw new ConvexError("You already have a pending application.");
    }

    return await ctx.db.insert("applications", {
      userId: user._id,
      walletAddress: user.walletAddress,
      portfolioLink,
      twitterHandle: cleanHandle,
      artistStatement,
      status: "submitted",
      submittedAt: Date.now(),
    });
  },
});

// Get the current authenticated user's application
export const getMyApplication = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("applications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      walletAddress: v.string(),
      portfolioLink: v.string(),
      twitterHandle: v.string(),
      artistStatement: v.string(),
      status: v.string(),
      reviewedBy: v.optional(v.id("users")),
      reviewNote: v.optional(v.string()),
      submittedAt: v.number(),
      reviewedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

// List applications by status (admin+, server-verified)
export const listByStatus = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("submitted"),
        v.literal("in_review"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { status, paginationOpts }) => {
    await requireRole(ctx, "admin");

    let query;
    if (status) {
      query = ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc");
    } else {
      query = ctx.db.query("applications").order("desc");
    }

    const { page, isDone, continueCursor } = await query.paginate(paginationOpts);

    // Enrich with user data
    const enriched = await Promise.all(
      page.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        return { ...app, user };
      })
    );

    return { page: enriched, isDone, continueCursor };
  },
});

// Count applications by status for accurate stats (admin+)
export const getStats = query({
  args: {},
  returns: v.object({
    submitted: v.number(),
    in_review: v.number(),
    approved: v.number(),
    rejected: v.number(),
    total: v.number(),
  }),
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const [submitted, inReview, approved, rejected] = await Promise.all([
      ctx.db.query("applications").withIndex("by_status", (q) => q.eq("status", "submitted")).collect(),
      ctx.db.query("applications").withIndex("by_status", (q) => q.eq("status", "in_review")).collect(),
      ctx.db.query("applications").withIndex("by_status", (q) => q.eq("status", "approved")).collect(),
      ctx.db.query("applications").withIndex("by_status", (q) => q.eq("status", "rejected")).collect(),
    ]);
    return {
      submitted: submitted.length,
      in_review: inReview.length,
      approved: approved.length,
      rejected: rejected.length,
      total: submitted.length + inReview.length + approved.length + rejected.length,
    };
  },
});

// Get a single application by ID (admin+, server-verified)
export const getById = query({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, { applicationId }) => {
    await requireRole(ctx, "admin");

    const app = await ctx.db.get(applicationId);
    if (!app) return null;

    const user = await ctx.db.get(app.userId);
    return { ...app, user };
  },
});

// Review an application: approve or reject (admin+, server-verified)
export const review = mutation({
  args: {
    walletAddress: v.string(),
    applicationId: v.id("applications"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, applicationId, decision, reviewNote }) => {
    const caller = await requireRole(ctx, "admin", walletAddress);

    if (reviewNote && reviewNote.length > 1000) throw new Error("Review note must be 1000 characters or less");

    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status === "approved" || app.status === "rejected") {
      throw new Error("Application has already been reviewed");
    }

    // Update application status
    await ctx.db.patch(applicationId, {
      status: decision,
      reviewedBy: caller._id,
      reviewNote,
      reviewedAt: Date.now(),
    });

    // If approved, promote user to creator (unless already admin/super_admin)
    if (decision === "approved") {
      const user = await ctx.db.get(app.userId);
      const roleHierarchy = { user: 0, creator: 1, admin: 2, super_admin: 3 };
      if (user && roleHierarchy[user.role as keyof typeof roleHierarchy] < roleHierarchy.creator) {
        await ctx.db.patch(app.userId, { role: "creator" });
      }
    }

    // Notify the applicant
    await ctx.db.insert("notifications", {
      userId: app.userId,
      type: decision === "approved" ? "application_approved" : "application_rejected",
      title: decision === "approved" ? "Application Approved!" : "Application Update",
      message:
        decision === "approved"
          ? "Congratulations! You are now a verified creator. Set up your profile to get started."
          : `Your application was not approved at this time.${reviewNote ? ` Reviewer note: ${reviewNote}` : " You may reapply."}`,
      linkTo: decision === "approved" ? "/onboarding" : "/apply",
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true, decision };
  },
});

// Revoke an approved application back to rejected (admin+, server-verified)
export const revoke = mutation({
  args: {
    walletAddress: v.string(),
    applicationId: v.id("applications"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { walletAddress, applicationId, reason }) => {
    const caller = await requireRole(ctx, "admin", walletAddress);

    if (reason && reason.length > 1000) throw new Error("Reason must be 1000 characters or less");

    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.status !== "approved") throw new Error("Only approved applications can be revoked");

    // Update application status to rejected
    await ctx.db.patch(applicationId, {
      status: "rejected",
      reviewedBy: caller._id,
      reviewNote: reason ?? "Creator status revoked by admin",
      reviewedAt: Date.now(),
    });

    // Downgrade user role back to user (only if currently creator, protect admin/super_admin)
    const user = await ctx.db.get(app.userId);
    if (user && user.role === "creator") {
      await ctx.db.patch(app.userId, { role: "user" });
    }

    // Notify the user
    await ctx.db.insert("notifications", {
      userId: app.userId,
      type: "application_rejected",
      title: "Creator Status Revoked",
      message: reason ?? "Your creator status has been revoked. Please contact support for details.",
      linkTo: "/apply",
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
