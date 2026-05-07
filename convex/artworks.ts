import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { requireRole } from "./lib/auth";

// License option validator for public responses
const licenseOptionValidator = v.object({
  licenseType: v.string(),
  price: v.number(),
  printLimit: v.optional(v.number()),
  printsMinted: v.optional(v.number()),
  resaleMinPrice: v.optional(v.number()),
});

// Public artwork validator (no r2FullKey - safe for any public caller)
const publicArtworkValidator = v.object({
  _id: v.id("artworks"),
  _creationTime: v.number(),
  creatorId: v.id("users"),
  walletAddress: v.string(),
  name: v.string(),
  symbol: v.string(),
  description: v.string(),
  detailsDescription: v.optional(v.string()),
  attributes: v.array(v.object({ trait_type: v.string(), value: v.string() })),
  tags: v.array(v.string()),
  collectionMode: v.string(),
  collectionId: v.optional(v.string()),
  r2PreviewKey: v.string(),
  supplementaryImages: v.optional(
    v.array(
      v.object({
        file: v.string(),
        type: v.string(),
        size: v.number(),
        r2Key: v.string(),
      })
    )
  ),
  deliveryType: v.optional(v.union(
    v.literal("digital"),
    v.literal("physical"),
    v.literal("both")
  )),
  // Multi-license support
  licenseOptions: v.optional(v.array(licenseOptionValidator)),
  // Legacy single-license fields (for backward compat)
  licenseType: v.optional(v.string()),
  printSizes: v.optional(
    v.array(
      v.object({
        label: v.string(),
        widthCm: v.number(),
        heightCm: v.number(),
        priceAddon: v.number(),
      })
    )
  ),
  shippingRates: v.optional(
    v.array(
      v.object({
        zone: v.string(),
        method: v.string(),
        price: v.number(),
        estimatedDays: v.string(),
      })
    )
  ),
  royaltyBasisPoints: v.number(),
  royaltyRecipients: v.array(v.object({ address: v.string(), share: v.number() })),
  status: v.string(),
  mintAddress: v.optional(v.string()),
  metadataUri: v.optional(v.string()),
  salesCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Public artwork with display name (no r2FullKey - safe for any public caller)
const publicArtworkWithDisplayNameValidator = v.object({
  _id: v.id("artworks"),
  _creationTime: v.number(),
  creatorId: v.id("users"),
  walletAddress: v.string(),
  creatorDisplayName: v.optional(v.string()),
  name: v.string(),
  symbol: v.string(),
  description: v.string(),
  detailsDescription: v.optional(v.string()),
  attributes: v.array(v.object({ trait_type: v.string(), value: v.string() })),
  tags: v.array(v.string()),
  collectionMode: v.string(),
  collectionId: v.optional(v.string()),
  r2PreviewKey: v.string(),
  supplementaryImages: v.optional(
    v.array(
      v.object({
        file: v.string(),
        type: v.string(),
        size: v.number(),
        r2Key: v.string(),
      })
    )
  ),
  deliveryType: v.optional(v.union(
    v.literal("digital"),
    v.literal("physical"),
    v.literal("both")
  )),
  // Multi-license support
  licenseOptions: v.optional(v.array(licenseOptionValidator)),
  // Legacy single-license fields (for backward compat)
  licenseType: v.optional(v.string()),
  printSizes: v.optional(
    v.array(
      v.object({
        label: v.string(),
        widthCm: v.number(),
        heightCm: v.number(),
        priceAddon: v.number(),
      })
    )
  ),
  shippingRates: v.optional(
    v.array(
      v.object({
        zone: v.string(),
        method: v.string(),
        price: v.number(),
        estimatedDays: v.string(),
      })
    )
  ),
  royaltyBasisPoints: v.number(),
  royaltyRecipients: v.array(v.object({ address: v.string(), share: v.number() })),
  status: v.string(),
  mintAddress: v.optional(v.string()),
  metadataUri: v.optional(v.string()),
  salesCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Create and mint an artwork.
 * Called after Step 1 image upload in the creation flow.
 * Returns the artwork ID for subsequent updates.
 */
export const createArtwork = mutation({
  args: {
    walletAddress: v.string(),
    name: v.string(),
    symbol: v.string(),
    description: v.string(),
    detailsDescription: v.optional(v.string()),
    attributes: v.array(v.object({ trait_type: v.string(), value: v.string() })),
    tags: v.array(v.string()),
    collectionMode: v.union(v.literal("existing"), v.literal("new"), v.literal("none")),
    collectionId: v.optional(v.string()),
    newCollection: v.optional(v.object({ name: v.string(), description: v.string() })),
    r2PreviewKey: v.string(),
    originalFileUrl: v.optional(v.string()),
    supplementaryImages: v.optional(
      v.array(
        v.object({
          file: v.string(),
          type: v.string(),
          size: v.number(),
          r2Key: v.string(),
        })
      )
    ),
    deliveryType: v.optional(v.union(
      v.literal("digital"),
      v.literal("physical"),
      v.literal("both")
    )),
    // Multi-license support: array of license options
    licenseOptions: v.array(v.object({
      licenseType: v.union(
        v.literal("personal_use"),
        v.literal("commercial_digital"),
        v.literal("limited_print")
      ),
      price: v.number(),
      printLimit: v.optional(v.number()),
      resaleMinPrice: v.optional(v.number()),
    })),
    printSizes: v.optional(
      v.array(
        v.object({
          label: v.string(),
          widthCm: v.number(),
          heightCm: v.number(),
          priceAddon: v.number(),
        })
      )
    ),
    shippingRates: v.optional(
      v.array(
        v.object({
          zone: v.string(),
          method: v.string(),
          price: v.number(),
          estimatedDays: v.string(),
        })
      )
    ),
    royaltyBasisPoints: v.number(),
    royaltyRecipients: v.array(v.object({ address: v.string(), share: v.number() })),
  },
  returns: v.object({ artworkId: v.id("artworks") }),
  handler: async (ctx: MutationCtx, args) => {
    // Verify creator role and wallet ownership
    const user = await requireRole(ctx, "creator", args.walletAddress);

    // Validate required image uploads
    if (!args.r2PreviewKey) {
      throw new ConvexError("Image upload required: preview image must be provided");
    }

    // Validate licenseOptions array
    if (!args.licenseOptions || args.licenseOptions.length === 0) {
      throw new ConvexError("At least one license option is required");
    }

    // Check for duplicate license types
    const licenseTypes = args.licenseOptions.map(opt => opt.licenseType);
    if (new Set(licenseTypes).size !== licenseTypes.length) {
      throw new ConvexError("Duplicate license types are not allowed");
    }

    // Validate each license option
    for (const opt of args.licenseOptions) {
      if (opt.price < 0) {
        throw new ConvexError(`Price must be non-negative for ${opt.licenseType}`);
      }
      if (opt.licenseType === "limited_print") {
        if (!opt.printLimit || opt.printLimit < 2) {
          throw new ConvexError("Edition limit is required for limited print and must be at least 2");
        }
      }
    }

    // Initialize printsMinted for limited_print entries
    const licenseOptionsWithMinted = args.licenseOptions.map(opt => ({
      ...opt,
      printsMinted: opt.licenseType === "limited_print" ? 0 : undefined,
    }));

    // Infer deliveryType: physical if any non-digital license, else digital
    const hasPhysicalLicense = args.licenseOptions.some(opt =>
      opt.licenseType !== "commercial_digital"
    );
    const deliveryType = args.deliveryType ?? (hasPhysicalLicense ? "physical" : "digital");

    // Handle collection mode - only set finalCollectionId if mode requires it
    let finalCollectionId: string | undefined;
    if (args.collectionMode === "existing") {
      if (!args.collectionId) {
        throw new ConvexError("Collection ID required for existing collection mode");
      }
      // Validate and convert string to typed Id, then do O(1) lookup
      const collectionId = ctx.db.normalizeId("collections", args.collectionId);
      if (!collectionId) {
        throw new ConvexError("Invalid collection ID");
      }
      const collection = await ctx.db.get(collectionId);
      if (!collection) {
        throw new ConvexError("Collection not found");
      }
      if (collection.creatorId !== user._id) {
        throw new ConvexError("Unauthorized: collection does not belong to creator");
      }
      finalCollectionId = args.collectionId;
    } else if (args.collectionMode === "new") {
      if (!args.newCollection?.name) {
        throw new ConvexError("Collection name is required when creating a new collection");
      }
      const collectionId = await ctx.db.insert("collections", {
        creatorId: user._id,
        walletAddress: user.walletAddress,
        name: args.newCollection.name,
        description: args.newCollection.description,
        createdAt: Date.now(),
      });
      finalCollectionId = collectionId;
    }

    // Create artwork document with multi-license support
    const artworkId = await ctx.db.insert("artworks", {
      creatorId: user._id,
      walletAddress: user.walletAddress,
      name: args.name,
      symbol: args.symbol,
      description: args.description,
      detailsDescription: args.detailsDescription,
      attributes: args.attributes,
      tags: args.tags,
      collectionMode: args.collectionMode,
      collectionId: finalCollectionId,
      r2PreviewKey: args.r2PreviewKey,
      originalFileUrl: args.originalFileUrl,
      supplementaryImages: args.supplementaryImages,
      deliveryType: deliveryType,
      licenseOptions: licenseOptionsWithMinted,
      printSizes: args.printSizes || [],
      shippingRates: args.shippingRates || [],
      royaltyBasisPoints: args.royaltyBasisPoints,
      royaltyRecipients: args.royaltyRecipients,
      status: "minted",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { artworkId };
  },
});

/**
 * Get a single artwork by ID.
 * Public query — returns artwork details for discovery and detail pages.
 * Strips originalFileUrl to prevent access to original assets.
 */
export const getById = query({
  args: { id: v.id("artworks") },
  returns: v.union(publicArtworkWithDisplayNameValidator, v.null()),
  handler: async (ctx: QueryCtx, args) => {
    const artwork = await ctx.db.get(args.id);
    if (!artwork) return null;

    // Join with users table to get displayName
    const user = await ctx.db.get(artwork.creatorId);

    // Return only schema-approved fields (strips originalFileUrl, r2FullKey, legacy fields)
    return {
      _id: artwork._id,
      _creationTime: artwork._creationTime,
      creatorId: artwork.creatorId,
      walletAddress: artwork.walletAddress,
      creatorDisplayName: user?.displayName,
      name: artwork.name,
      symbol: artwork.symbol,
      description: artwork.description,
      detailsDescription: artwork.detailsDescription,
      attributes: artwork.attributes,
      tags: artwork.tags,
      collectionMode: artwork.collectionMode,
      collectionId: artwork.collectionId,
      r2PreviewKey: artwork.r2PreviewKey,
      supplementaryImages: artwork.supplementaryImages,
      deliveryType: artwork.deliveryType,
      licenseOptions: artwork.licenseOptions,
      printSizes: artwork.printSizes,
      shippingRates: artwork.shippingRates,
      royaltyBasisPoints: artwork.royaltyBasisPoints,
      royaltyRecipients: artwork.royaltyRecipients,
      status: artwork.status,
      mintAddress: artwork.mintAddress,
      metadataUri: artwork.metadataUri,
      salesCount: artwork.salesCount,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    };
  },
});

/**
 * Get all artworks for a creator (by wallet address).
 * Public query — used by creator profile/portfolio and edit flows.
 *
 * TODO (pre-launch security): Replace with an authenticated getMyArtworks() query
 * that uses ctx.auth.getUserIdentity() so only the creator can see their own artworks.
 */
export const getByCreator = query({
  args: { walletAddress: v.string() },
  returns: v.array(publicArtworkValidator),
  handler: async (ctx: QueryCtx, args) => {
    const artworks = await ctx.db
      .query("artworks")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .take(100);

    return artworks.map((artwork) => ({
      _id: artwork._id,
      _creationTime: artwork._creationTime,
      creatorId: artwork.creatorId,
      walletAddress: artwork.walletAddress,
      name: artwork.name,
      symbol: artwork.symbol,
      description: artwork.description,
      detailsDescription: artwork.detailsDescription,
      attributes: artwork.attributes,
      tags: artwork.tags,
      collectionMode: artwork.collectionMode,
      collectionId: artwork.collectionId,
      r2PreviewKey: artwork.r2PreviewKey,
      supplementaryImages: artwork.supplementaryImages,
      deliveryType: artwork.deliveryType,
      licenseOptions: artwork.licenseOptions,
      printSizes: artwork.printSizes,
      shippingRates: artwork.shippingRates,
      royaltyBasisPoints: artwork.royaltyBasisPoints,
      royaltyRecipients: artwork.royaltyRecipients,
      status: artwork.status,
      mintAddress: artwork.mintAddress,
      metadataUri: artwork.metadataUri,
      salesCount: artwork.salesCount,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    }));
  },
});

/**
 * Get all artworks with a specific published status.
 * Public query — lists published artworks for discover page.
 * Only accepts "listed" | "minted" for public access.
 */
export const getByStatus = query({
  args: { status: v.union(v.literal("minted"), v.literal("listed")) },
  returns: v.array(publicArtworkWithDisplayNameValidator),
  handler: async (ctx: QueryCtx, args) => {
    const artworks = await ctx.db
      .query("artworks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .take(200);

    // Join with users table to get displayName
    return await Promise.all(
      artworks.map(async (artwork) => {
        const user = await ctx.db.get(artwork.creatorId);
        return {
          _id: artwork._id,
          _creationTime: artwork._creationTime,
          creatorId: artwork.creatorId,
          walletAddress: artwork.walletAddress,
          creatorDisplayName: user?.displayName,
          name: artwork.name,
          symbol: artwork.symbol,
          description: artwork.description,
          detailsDescription: artwork.detailsDescription,
          attributes: artwork.attributes,
          tags: artwork.tags,
          collectionMode: artwork.collectionMode,
          collectionId: artwork.collectionId,
          r2PreviewKey: artwork.r2PreviewKey,
          supplementaryImages: artwork.supplementaryImages,
          deliveryType: artwork.deliveryType,
          licenseOptions: artwork.licenseOptions,
          printSizes: artwork.printSizes,
          shippingRates: artwork.shippingRates,
          royaltyBasisPoints: artwork.royaltyBasisPoints,
          royaltyRecipients: artwork.royaltyRecipients,
          status: artwork.status,
          mintAddress: artwork.mintAddress,
          metadataUri: artwork.metadataUri,
          salesCount: artwork.salesCount,
          createdAt: artwork.createdAt,
          updatedAt: artwork.updatedAt,
        };
      })
    );
  },
});

/**
 * Update artwork metadata.
 * Can be called to update details before minting.
 * Only the creator can update their own artwork.
 */
export const update = mutation({
  args: {
    id: v.id("artworks"),
    walletAddress: v.string(),
    name: v.optional(v.string()),
    symbol: v.optional(v.string()),
    description: v.optional(v.string()),
    detailsDescription: v.optional(v.string()),
    attributes: v.optional(v.array(v.object({ trait_type: v.string(), value: v.string() }))),
    tags: v.optional(v.array(v.string())),
    format: v.optional(v.string()),
    deliveryType: v.optional(v.union(v.literal("digital"), v.literal("physical"), v.literal("both"))),
    // Multi-license support
    licenseOptions: v.optional(v.array(v.object({
      licenseType: v.union(
        v.literal("personal_use"),
        v.literal("commercial_digital"),
        v.literal("limited_print")
      ),
      price: v.number(),
      printLimit: v.optional(v.number()),
      resaleMinPrice: v.optional(v.number()),
    }))),
    printSizes: v.optional(v.array(v.object({ label: v.string(), widthCm: v.number(), heightCm: v.number(), priceAddon: v.number() }))),
    shippingRates: v.optional(v.array(v.object({ zone: v.string(), method: v.string(), price: v.number(), estimatedDays: v.string() }))),
    royaltyBasisPoints: v.optional(v.number()),
    royaltyRecipients: v.optional(v.array(v.object({ address: v.string(), share: v.number() }))),
    supplementaryImages: v.optional(
      v.array(
        v.object({
          file: v.string(),
          type: v.string(),
          size: v.number(),
          r2Key: v.string(),
        })
      )
    ),
    collectionMode: v.optional(v.union(v.literal("existing"), v.literal("new"), v.literal("none"))),
    collectionId: v.optional(v.id("collections")),
    newCollection: v.optional(v.object({ name: v.string(), description: v.string() })),
    originalFileUrl: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ _id: v.id("artworks"), _creationTime: v.number(), status: v.string() }),
    v.null(),
  ),
  handler: async (ctx: MutationCtx, args) => {
    // Verify creator role and wallet ownership
    const user = await requireRole(ctx, "creator", args.walletAddress);

    // Get artwork and verify ownership
    const artwork = await ctx.db.get(args.id);
    if (!artwork) throw new ConvexError("Artwork not found");
    if (artwork.creatorId !== user._id) throw new ConvexError("Unauthorized: not the creator");

    // Handle collection mode - determine final collection ID
    let finalCollectionId: string | undefined;
    if (args.collectionMode === "existing") {
      if (!args.collectionId) {
        throw new ConvexError("Collection ID required for existing collection mode");
      }
      // Validate and convert string to typed Id, then do O(1) lookup
      const collectionId = ctx.db.normalizeId("collections", args.collectionId);
      if (!collectionId) {
        throw new ConvexError("Invalid collection ID");
      }
      const collection = await ctx.db.get(collectionId);
      if (!collection) {
        throw new ConvexError("Collection not found");
      }
      if (collection.creatorId !== user._id) {
        throw new ConvexError("Unauthorized: collection does not belong to creator");
      }
      finalCollectionId = args.collectionId;
    } else if (args.collectionMode === "new") {
      if (!args.newCollection?.name) {
        throw new ConvexError("Collection name is required when creating a new collection");
      }
      const collectionId = await ctx.db.insert("collections", {
        creatorId: user._id,
        walletAddress: user.walletAddress,
        name: args.newCollection.name,
        description: args.newCollection.description,
        createdAt: Date.now(),
      });
      finalCollectionId = collectionId;
    }
    // If collectionMode === "none", finalCollectionId stays undefined to clear existing association

    // Validate licenseOptions if provided
    if (args.licenseOptions !== undefined) {
      if (args.licenseOptions.length === 0) {
        throw new ConvexError("At least one license option is required");
      }
      const licenseTypes = args.licenseOptions.map(opt => opt.licenseType);
      if (new Set(licenseTypes).size !== licenseTypes.length) {
        throw new ConvexError("Duplicate license types are not allowed");
      }
      for (const opt of args.licenseOptions) {
        if (opt.price < 0) {
          throw new ConvexError(`Price must be non-negative for ${opt.licenseType}`);
        }
        if (opt.licenseType === "limited_print") {
          if (!opt.printLimit || opt.printLimit < 2) {
            throw new ConvexError("Edition limit is required for limited print and must be at least 2");
          }
          // Don't allow reducing printLimit below printsMinted
          const existing = artwork.licenseOptions?.find(e => e.licenseType === "limited_print");
          if (existing?.printsMinted && opt.printLimit < existing.printsMinted) {
            throw new ConvexError(`Cannot reduce edition limit below already minted count (${existing.printsMinted})`);
          }
        }
      }
    }

    // Update only provided fields
    type LicenseOptionType = {
      licenseType: "personal_use" | "commercial_digital" | "limited_print";
      price: number;
      printLimit?: number;
      printsMinted?: number;
      resaleMinPrice?: number;
    };
    interface UpdateFields {
      updatedAt: number;
      name?: string;
      symbol?: string;
      description?: string;
      detailsDescription?: string;
      attributes?: Array<{ trait_type: string; value: string }>;
      tags?: string[];
      format?: string;
      deliveryType?: "digital" | "physical" | "both";
      licenseOptions?: LicenseOptionType[];
      printSizes?: Array<{ label: string; widthCm: number; heightCm: number; priceAddon: number }>;
      shippingRates?: Array<{ zone: string; method: string; price: number; estimatedDays: string }>;
      royaltyBasisPoints?: number;
      royaltyRecipients?: Array<{ address: string; share: number }>;
      supplementaryImages?: Array<{ file: string; type: string; size: number; r2Key: string }>;
      collectionId?: string;
      collectionMode?: "existing" | "new" | "none";
      originalFileUrl?: string;
    }
    const updates: UpdateFields = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.symbol !== undefined) updates.symbol = args.symbol;
    if (args.description !== undefined) updates.description = args.description;
    if (args.detailsDescription !== undefined) updates.detailsDescription = args.detailsDescription;
    if (args.attributes !== undefined) updates.attributes = args.attributes;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.deliveryType !== undefined) updates.deliveryType = args.deliveryType;
    // Handle licenseOptions update - preserve printsMinted for existing limited_print entries
    if (args.licenseOptions !== undefined) {
      updates.licenseOptions = args.licenseOptions.map(opt => {
        const existing = artwork.licenseOptions?.find(e => e.licenseType === opt.licenseType);
        return {
          ...opt,
          printsMinted: ["limited_print", "personal_use"].includes(opt.licenseType) ? (existing?.printsMinted ?? 0) : undefined,
        };
      });
      // Infer deliveryType if not explicitly provided
      if (args.deliveryType === undefined) {
        const hasPhysical = args.licenseOptions.some(opt => opt.licenseType !== "commercial_digital");
        updates.deliveryType = hasPhysical ? "physical" : "digital";
      }
    }
    if (args.printSizes !== undefined) updates.printSizes = args.printSizes;
    if (args.shippingRates !== undefined) updates.shippingRates = args.shippingRates;
    if (args.royaltyBasisPoints !== undefined) updates.royaltyBasisPoints = args.royaltyBasisPoints;
    if (args.royaltyRecipients !== undefined) updates.royaltyRecipients = args.royaltyRecipients;
    if (args.supplementaryImages !== undefined) updates.supplementaryImages = args.supplementaryImages;
    if (args.originalFileUrl !== undefined) updates.originalFileUrl = args.originalFileUrl;
    // Always update collectionMode and collectionId together when mode is provided
    if (args.collectionMode !== undefined) {
      updates.collectionMode = args.collectionMode;
      updates.collectionId = finalCollectionId;
    }

    await ctx.db.patch(args.id, updates);
    const updated = await ctx.db.get(args.id);
    if (!updated) throw new ConvexError("Failed to retrieve updated artwork");
    return {
      _id: updated._id,
      _creationTime: updated._creationTime,
      status: updated.status,
    };
  },
});

/**
 * Get all collections for a creator (by wallet address).
 * Public query — lists creator's collections for edit/manage.
 */
export const getCollectionsByCreator = query({
  args: { walletAddress: v.string() },
  returns: v.array(v.object({
    _id: v.id("collections"),
    _creationTime: v.number(),
    creatorId: v.id("users"),
    walletAddress: v.string(),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .take(50);
  },
});

/**
 * Mark artwork as minted and store on-chain reference.
 * Called after successful Solana minting.
 */
export const markMinted = mutation({
  args: {
    id: v.id("artworks"),
    walletAddress: v.string(),
    mintAddress: v.string(),
    metadataUri: v.string(),
  },
  returns: v.union(
    v.object({ _id: v.id("artworks"), _creationTime: v.number(), status: v.string() }),
    v.null(),
  ),
  handler: async (ctx: MutationCtx, args) => {
    // Verify creator role and wallet ownership
    const user = await requireRole(ctx, "creator", args.walletAddress);

    // Get artwork and verify ownership
    const artwork = await ctx.db.get(args.id);
    if (!artwork) throw new ConvexError("Artwork not found");
    if (artwork.creatorId !== user._id) throw new ConvexError("Unauthorized: not the creator");

    // Update status and on-chain references
    await ctx.db.patch(args.id, {
      status: "minted",
      mintAddress: args.mintAddress,
      metadataUri: args.metadataUri,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    return updated
      ? { _id: updated._id, _creationTime: updated._creationTime, status: updated.status }
      : null;
  },
});

/**
 * Publish a minted artwork for sale.
 * Transitions status from "minted" → "listed" so it appears on the Discover page.
 * No on-chain minting required — simulated flow only.
 */
/**
 * Unlist a published artwork, removing it from the Discover page.
 * Transitions status from "listed" → "minted".
 * Existing purchases and licenses are unaffected.
 */
export const unlist = mutation({
  args: {
    id: v.id("artworks"),
    walletAddress: v.string(),
  },
  returns: v.object({ _id: v.id("artworks"), status: v.string() }),
  handler: async (ctx: MutationCtx, args) => {
    const user = await requireRole(ctx, "creator", args.walletAddress);

    const artwork = await ctx.db.get(args.id);
    if (!artwork) throw new ConvexError("Artwork not found");
    if (artwork.creatorId !== user._id) throw new ConvexError("Unauthorized: not the creator");
    if (artwork.status !== "listed") throw new ConvexError("Only listed artworks can be unlisted");

    await ctx.db.patch(args.id, { status: "minted", updatedAt: Date.now() });
    return { _id: args.id, status: "minted" };
  },
});

export const publish = mutation({
  args: {
    id: v.id("artworks"),
    walletAddress: v.string(),
  },
  returns: v.object({ _id: v.id("artworks"), status: v.string() }),
  handler: async (ctx: MutationCtx, args) => {
    const user = await requireRole(ctx, "creator", args.walletAddress);

    const artwork = await ctx.db.get(args.id);
    if (!artwork) throw new ConvexError("Artwork not found");
    if (artwork.creatorId !== user._id) throw new ConvexError("Unauthorized: not the creator");
    if (artwork.status !== "minted") throw new ConvexError("Only minted artworks can be published");
    // TODO (Future #7): Re-enable when smart contract integration is complete
    // if (!artwork.mintAddress) throw new ConvexError("Artwork must be minted on-chain before listing");

    await ctx.db.patch(args.id, { status: "listed", updatedAt: Date.now() });
    return { _id: args.id, status: "listed" };
  },
});
