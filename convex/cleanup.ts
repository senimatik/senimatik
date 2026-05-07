import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { requireRole } from "./lib/auth";

// Initialize R2 client
const r2 = new R2(components.r2);

/**
 * Cleanup cron job to delete orphaned R2 uploads.
 * Runs daily to remove files uploaded during Step1Artwork but never deployed.
 *
 * Called by: Convex cron scheduler (convex/crons.ts)
 * Internal only - not exposed to clients.
 */
export const cleanupOrphanedUploads = internalMutation({
  args: {},
  returns: v.object({
    deletedFiles: v.number(),
    errors: v.number(),
    processedUploads: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    // Find all uploads older than 7 days with no associated artwork
    const orphanedUploads = await ctx.db
      .query("uploads")
      .filter((q) => q.and(q.eq(q.field("artworkId"), undefined), q.lte(q.field("expiresAt"), now)))
      .collect();

    let deletedCount = 0;
    let errorCount = 0;

    for (const upload of orphanedUploads) {
      try {
        // Delete all R2 keys associated with this upload
        for (const key of upload.r2Keys) {
          try {
            await r2.deleteObject(ctx, key);
            deletedCount++;
          } catch (err) {
            console.error(`Failed to delete R2 key ${key}:`, err);
            errorCount++;
          }
        }

        // Delete the upload record from database
        await ctx.db.delete(upload._id);
      } catch (err) {
        console.error(`Failed to cleanup upload ${upload._id}:`, err);
        errorCount++;
      }
    }

    console.log(
      `Cleanup job completed: deleted ${deletedCount} files, ${errorCount} errors`
    );

    return {
      deletedFiles: deletedCount,
      errors: errorCount,
      processedUploads: orphanedUploads.length,
    };
  },
});

/**
 * Create an upload record when images are uploaded.
 * Called from Step1Artwork after successfully uploading to R2.
 */
export const createUploadRecord = mutation({
  args: {
    walletAddress: v.string(),
    r2Keys: v.array(v.string()),
  },
  returns: v.object({ uploadId: v.id("uploads") }),
  handler: async (ctx, args) => {
    // Verify creator role and wallet ownership
    const user = await requireRole(ctx, "creator", args.walletAddress);

    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const uploadId = await ctx.db.insert("uploads", {
      creatorId: user._id,
      walletAddress: user.walletAddress,
      r2Keys: args.r2Keys,
      artworkId: undefined, // Not linked to artwork yet
      createdAt: now,
      expiresAt: now + sevenDaysInMs,
    });

    return { uploadId };
  },
});

/**
 * Link upload record to artwork when form is deployed.
 * Call this in createArtwork after inserting artwork.
 * Internal only - called from createArtwork mutation.
 */
export const linkUploadToArtwork = internalMutation({
  args: {
    uploadId: v.id("uploads"),
    artworkId: v.id("artworks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uploadId, {
      artworkId: args.artworkId,
    });
    return null;
  },
});
