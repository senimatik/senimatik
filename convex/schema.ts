import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(),
    tokenIdentifier: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal("user"),
      v.literal("creator"),
      v.literal("admin"),
      v.literal("super_admin")
    ),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    socialUrl: v.optional(v.string()),
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
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletAddress"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("application_approved"),
      v.literal("application_rejected"),
      v.literal("application_in_review"),
      v.literal("sale_completed"),
      v.literal("order_processing"),
      v.literal("order_shipped"),
      v.literal("order_delivered")
    ),
    title: v.string(),
    message: v.string(),
    linkTo: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  applications: defineTable({
    userId: v.id("users"),
    walletAddress: v.string(),
    portfolioLink: v.string(),
    twitterHandle: v.string(),
    artistStatement: v.string(),
    status: v.union(
      v.literal("submitted"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewNote: v.optional(v.string()),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_wallet", ["walletAddress"]),

  artworks: defineTable({
    // Ownership
    creatorId: v.id("users"),
    walletAddress: v.string(),

    // Metadata (Step 2)
    name: v.string(),
    symbol: v.string(),
    description: v.string(), // Immutable original description
    detailsDescription: v.optional(v.string()), // Editable marketplace description
    attributes: v.array(v.object({ trait_type: v.string(), value: v.string() })),
    tags: v.array(v.string()),

    // Collection (Step 3)
    collectionMode: v.union(
      v.literal("existing"),
      v.literal("new"),
      v.literal("none")
    ),
    collectionId: v.optional(v.string()),

    // Images (Step 1) — R2 keys
    r2PreviewKey: v.string(),
    originalFileUrl: v.optional(v.string()), // External link to original file, revealed post-purchase
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

    // Delivery type — determines whether shipping/address apply
    deliveryType: v.optional(v.union(
      v.literal("digital"),   // download only
      v.literal("physical"),  // shipped physical art
      v.literal("both")       // digital download + physical art
    )),

    // License (Step 4) — Multi-license support
    // New: array of license options, each with its own price and settings
    licenseOptions: v.optional(v.array(v.object({
      licenseType: v.union(
        v.literal("personal_use"),
        v.literal("commercial_digital"),
        v.literal("limited_print")
      ),
      price: v.number(),
      printLimit: v.optional(v.number()),      // only for limited_print
      printsMinted: v.optional(v.number()),    // only for limited_print
      resaleMinPrice: v.optional(v.number()),  // only for personal_use/limited_print
    }))),

    // Print & Shipping Configuration
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

    // Royalties (Step 5)
    royaltyBasisPoints: v.number(),
    royaltyRecipients: v.array(
      v.object({ address: v.string(), share: v.number() })
    ),

    // Denormalized counter — incremented on each purchase, avoids full-scan counting
    salesCount: v.optional(v.number()),

    // Status
    status: v.union(v.literal("minted"), v.literal("listed")),

    // On-chain reference (filled after mint)
    mintAddress: v.optional(v.string()),
    metadataUri: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_wallet", ["walletAddress"])
    .index("by_status", ["status"])
    .index("by_creator_and_status", ["creatorId", "status"]),

  collections: defineTable({
    creatorId: v.id("users"),
    walletAddress: v.string(),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_wallet", ["walletAddress"]),

  purchases: defineTable({
    buyerId: v.id("users"),
    buyerWallet: v.string(),
    artworkId: v.id("artworks"),
    creatorId: v.id("users"),
    licenseType: v.string(),  // snapshot from artwork at purchase time
    deliveryType: v.string(), // snapshot from artwork
    selectedPrintSize: v.optional(v.object({
      label: v.string(),
      widthCm: v.number(),
      heightCm: v.number(),
      priceAddon: v.number(),
    })),
    selectedShipping: v.optional(v.object({
      zone: v.string(),
      method: v.string(),
      price: v.number(),
      estimatedDays: v.string(),
    })),
    shippingAddress: v.optional(v.object({
      fullName: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
    basePrice: v.number(),
    totalPrice: v.number(),
    paymentStatus: v.union(
      v.literal("simulated"),
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("failed")
    ),
    paymentTxHash: v.optional(v.string()),
    orderStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
    )),
    courierName: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    statusUpdatedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_artwork", ["artworkId"])
    .index("by_creator", ["creatorId"]),

  licenses: defineTable({
    purchaseId: v.id("purchases"),
    artworkId: v.id("artworks"),
    buyerId: v.id("users"),
    buyerWallet: v.string(),
    creatorId: v.id("users"),
    licenseType: v.string(),  // snapshot
    deliveryType: v.string(), // snapshot
    verificationId: v.string(),
    printEditionNumber: v.optional(v.string()), // e.g. "3 of 50"
    isActive: v.boolean(),
    issuedAt: v.number(),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_artwork", ["artworkId"])
    .index("by_verification", ["verificationId"])
    .index("by_purchase", ["purchaseId"]),

  // Track temporary R2 uploads for cleanup of orphaned files
  uploads: defineTable({
    creatorId: v.id("users"),
    walletAddress: v.string(),
    r2Keys: v.array(v.string()), // Array of R2 keys uploaded
    artworkId: v.optional(v.id("artworks")), // Null if abandoned
    createdAt: v.number(),
    expiresAt: v.number(), // 7 days from creation
  })
    .index("by_creator", ["creatorId"])
    .index("by_artwork", ["artworkId"])
    .index("by_expires", ["expiresAt"]),
});
