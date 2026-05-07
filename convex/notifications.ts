import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { getAuthUser, requireRole } from "./lib/auth";

// Get the last 50 notifications for the authenticated user
export const getMyNotifications = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      _creationTime: v.number(),
      userId: v.id("users"),
      type: v.string(),
      title: v.string(),
      message: v.string(),
      linkTo: v.optional(v.string()),
      isRead: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    // console.log("[getMyNotifications] user:", user?._id ?? "null");
    if (!user) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    // console.log("[getMyNotifications] found", notifications.length, "notifications");
    return notifications;
  },
});

// Count of unread notifications — powers the Navbar badge
export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    // console.log("[getUnreadCount] user:", user?._id ?? "null");
    if (!user) return 0;

    const first = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .first();

    return first ? 1 : 0;
  },
});

// Mark a single notification as read (validates ownership)
export const markAsRead = mutation({
  args: {
    walletAddress: v.string(),
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, { walletAddress, notificationId }) => {
    const user = await requireRole(ctx, "user", walletAddress);

    const notification = await ctx.db.get(notificationId);
    if (!notification) throw new ConvexError("Notification not found");
    if (notification.userId !== user._id) throw new ConvexError("Unauthorized");

    await ctx.db.patch(notificationId, { isRead: true });
    return null;
  },
});

// Mark all unread notifications as read for the authenticated user
export const markAllAsRead = mutation({
  args: {
    walletAddress: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { walletAddress }) => {
    const user = await requireRole(ctx, "user", walletAddress);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
    return null;
  },
});
