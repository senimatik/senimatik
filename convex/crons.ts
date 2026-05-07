import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily cleanup job to remove orphaned R2 uploads.
 * Runs every day at 2:00 AM UTC.
 * Deletes files uploaded during Step1Artwork but never deployed (older than 7 days).
 */
crons.daily(
  "cleanup orphaned uploads",
  { hourUTC: 2, minuteUTC: 0 },
  internal.cleanup.cleanupOrphanedUploads
);

export default crons;
