import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { getAuthUser, requireRole } from "./lib/auth";

// Initialize R2 client
export const r2 = new R2(components.r2);

// Type for R2 upload response
interface R2UploadResponse {
  url: URL | string;
}

/**
 * Generate a presigned upload URL for artwork assets with structured keys.
 * Called by client during Step1Artwork upload.
 *
 * Key structure (bucket handled separately by R2 component):
 * - artworks/{walletAddress}/{uuid}/preview.webp
 * - artworks/{walletAddress}/{uuid}/details.webp
 */
export const generateArtworkUploadUrl = mutation({
  args: {
    walletAddress: v.string(),
    type: v.union(v.literal("preview"), v.literal("details")),
    fileName: v.string(),
  },
  returns: v.object({
    url: v.string(),
    key: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify creator role and wallet ownership
    const user = await requireRole(ctx, "creator", args.walletAddress);

    const walletAddress = user.walletAddress;
    const uuid = crypto.randomUUID();

    // Build structured key based on type
    let key: string;
    if (args.type === "preview") {
      key = `artworks/${walletAddress}/${uuid}/preview.webp`;
    } else {
      // details
      key = `artworks/${walletAddress}/${uuid}/details.webp`;
    }

    // Generate presigned upload URL
    const uploadResult = await r2.generateUploadUrl(key);

    // r2.generateUploadUrl returns { url: URL } object
    let urlString: string;
    if (typeof uploadResult === 'object' && uploadResult !== null && 'url' in uploadResult) {
      const urlObj = (uploadResult as R2UploadResponse).url;
      urlString = urlObj instanceof URL ? urlObj.toString() : String(urlObj);
    } else {
      urlString = String(uploadResult);
    }

    return {
      url: urlString,
      key,
    };
  },
});

/**
 * Get a signed URL to serve an artwork preview image from R2.
 * Public query — returns time-limited signed URL for preview images only.
 * Only serves preview keys (watermarked images). Original/premium files require purchase.
 * Expiration is capped to 1 hour to prevent long-lived URLs.
 */
export const getArtworkUrl = query({
  args: {
    key: v.string(),
    expirationSeconds: v.optional(v.number()),
  },
  returns: v.object({ url: v.string() }),
  handler: async (_ctx, args) => {
    // Only serve preview keys (publicly visible watermarked images)
    if (!args.key.includes("/preview")) {
      throw new ConvexError("Unauthorized: only preview images can be served");
    }

    // Cap expiration to 1 hour max to prevent long-lived URLs
    const maxExpirationSeconds = 3600; // 1 hour
    const expirationSeconds = Math.min(args.expirationSeconds ?? 3600, maxExpirationSeconds);

    const url = await r2.getUrl(args.key, {
      expiresIn: expirationSeconds,
    });
    return { url };
  },
});

/**
 * Generate a presigned upload URL for profile avatar.
 * Any authenticated user can upload their own avatar.
 * Key: profiles/{walletAddress}/avatar.webp (deterministic, overwrites on re-upload)
 */
export const generateProfileImageUploadUrl = mutation({
  args: {},
  returns: v.object({
    url: v.string(),
    key: v.string(),
  }),
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) throw new ConvexError("Authentication required");

    const key = `profiles/${user.walletAddress}/avatar.webp`;
    const uploadResult = await r2.generateUploadUrl(key);

    let urlString: string;
    if (typeof uploadResult === "object" && uploadResult !== null && "url" in uploadResult) {
      const urlObj = (uploadResult as R2UploadResponse).url;
      urlString = urlObj instanceof URL ? urlObj.toString() : String(urlObj);
    } else {
      urlString = String(uploadResult);
    }

    return { url: urlString, key };
  },
});

/**
 * Delete files from R2 by key.
 * Called when:
 * 1. User removes images during Step1Artwork (trash icon)
 * 2. Background cleanup job removes orphaned uploads
 */
export const deleteFromR2 = mutation({
  args: {
    walletAddress: v.string(),
    keys: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      key: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await requireRole(ctx, "creator", args.walletAddress);

    // Verify all keys belong to caller's wallet (artworks/{walletAddress}/...)
    for (const key of args.keys) {
      if (!key.startsWith(`artworks/${args.walletAddress}/`)) {
        throw new ConvexError("Unauthorized: cannot delete files from other wallets");
      }
    }

    const results = [];
    for (const key of args.keys) {
      try {
        await r2.deleteObject(ctx, key);
        results.push({ key, success: true });
      } catch (err) {
        console.error(`Failed to delete ${key}:`, err);
        results.push({ key, success: false, error: String(err) });
      }
    }
    return results;
  },
});
