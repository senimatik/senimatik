import { mutation, query } from "./_generated/server";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireRole } from "./lib/auth";
import { findLicenseOption } from "./lib/licenses";

const shippingAddressValidator = v.object({
  fullName: v.string(),
  street: v.string(),
  city: v.string(),
  state: v.string(),
  zipCode: v.string(),
  country: v.string(),
  phone: v.optional(v.string()),
});

/**
 * Purchase an artwork.
 * Records a simulated payment and issues a license.
 * Buyer must not be the creator of the artwork.
 */
export const create = mutation({
  args: {
    walletAddress: v.string(),
    artworkId: v.id("artworks"),
    // Multi-license: buyer selects which license type to purchase
    selectedLicenseType: v.union(
      v.literal("personal_use"),
      v.literal("commercial_digital"),
      v.literal("limited_print")
    ),
    selectedPrintSizeIndex: v.optional(v.number()),
    selectedShippingIndex: v.optional(v.number()),
    shippingAddress: v.optional(shippingAddressValidator),
  },
  returns: v.object({
    purchaseId: v.id("purchases"),
    licenseId: v.id("licenses"),
    verificationId: v.string(),
  }),
  handler: async (ctx: MutationCtx, args) => {
    const buyer = await requireRole(ctx, "user", args.walletAddress);

    const artwork = await ctx.db.get(args.artworkId);
    if (!artwork) throw new ConvexError("Artwork not found");
    if (artwork.status !== "listed") throw new ConvexError("Artwork is not available for purchase");
    if (artwork.creatorId === buyer._id) throw new ConvexError("Cannot purchase your own artwork");

    // Find the selected license option
    const selectedLicense = findLicenseOption(artwork, args.selectedLicenseType);
    if (!selectedLicense) {
      throw new ConvexError(`License type "${args.selectedLicenseType}" is not available for this artwork`);
    }

    // Determine delivery type based on selected license
    const isDigitalOnly = args.selectedLicenseType === "commercial_digital";
    const deliveryType = isDigitalOnly ? "digital" : (artwork.deliveryType ?? "physical");
    const requiresShipping = !isDigitalOnly && (deliveryType === "physical" || deliveryType === "both");

    if (requiresShipping) {
      if (!args.shippingAddress) throw new ConvexError("Shipping address is required for physical delivery");
      if (args.selectedShippingIndex === undefined) throw new ConvexError("Shipping method is required for physical delivery");
    }

    // Snapshot selected print size
    let selectedPrintSize: { label: string; widthCm: number; heightCm: number; priceAddon: number } | undefined;
    let printAddon = 0;
    if (args.selectedPrintSizeIndex !== undefined && artwork.printSizes && artwork.printSizes.length > 0) {
      const ps = artwork.printSizes[args.selectedPrintSizeIndex];
      if (!ps) throw new ConvexError("Invalid print size selection");
      selectedPrintSize = ps;
      printAddon = ps.priceAddon;
    }

    // Snapshot selected shipping
    let selectedShipping: { zone: string; method: string; price: number; estimatedDays: string } | undefined;
    let shippingCost = 0;
    if (args.selectedShippingIndex !== undefined && artwork.shippingRates && artwork.shippingRates.length > 0) {
      const sr = artwork.shippingRates[args.selectedShippingIndex];
      if (!sr) throw new ConvexError("Invalid shipping selection");
      selectedShipping = sr;
      shippingCost = sr.price;
    }

    // Enforce caps for limited editions and personal use (1:1 art)
    if (args.selectedLicenseType === "limited_print") {
      const minted = selectedLicense.printsMinted ?? 0;
      const limit = selectedLicense.printLimit ?? 0;
      if (limit > 0 && minted >= limit) throw new ConvexError("Edition sold out");
    } else if (args.selectedLicenseType === "personal_use") {
      const sold = selectedLicense.printsMinted ?? 0;
      if (sold >= 1) throw new ConvexError("This 1:1 artwork is already sold");
    }

    const basePrice = selectedLicense.price;
    const totalPrice = basePrice + printAddon + shippingCost;

    // Increment denormalized sales counter on artwork
    await ctx.db.patch(args.artworkId, {
      salesCount: (artwork.salesCount ?? 0) + 1,
      updatedAt: Date.now(),
    });

    // Insert purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      buyerId: buyer._id,
      buyerWallet: buyer.walletAddress,
      artworkId: args.artworkId,
      creatorId: artwork.creatorId,
      licenseType: args.selectedLicenseType,
      deliveryType,
      selectedPrintSize,
      selectedShipping,
      shippingAddress: args.shippingAddress,
      basePrice,
      totalPrice,
      paymentStatus: "simulated",
      // Set initial order status for physical/both deliveries
      ...(requiresShipping ? { orderStatus: "pending" as const } : {}),
      createdAt: Date.now(),
    });

    // Generate unique verificationId using crypto
    const verificationId = crypto.randomUUID();

    // Determine print edition number and increment counter for limited_print & personal_use
    let printEditionNumber: string | undefined;
    if (args.selectedLicenseType === "limited_print" || args.selectedLicenseType === "personal_use") {
      const newMinted = (selectedLicense.printsMinted ?? 0) + 1;
      if (args.selectedLicenseType === "limited_print") {
        printEditionNumber = `${newMinted} of ${selectedLicense.printLimit ?? "?"}`;
      }

      // Update the specific license option's printsMinted counter
      if (artwork.licenseOptions) {
        const updatedOptions = artwork.licenseOptions.map(opt => {
          if (opt.licenseType === args.selectedLicenseType) {
            return { ...opt, printsMinted: newMinted };
          }
          return opt;
        });
        await ctx.db.patch(args.artworkId, {
          licenseOptions: updatedOptions,
          updatedAt: Date.now(),
        });
      }
    }

    // Insert license record
    const licenseId = await ctx.db.insert("licenses", {
      purchaseId,
      artworkId: args.artworkId,
      buyerId: buyer._id,
      buyerWallet: buyer.walletAddress,
      creatorId: artwork.creatorId,
      licenseType: args.selectedLicenseType,
      deliveryType,
      verificationId,
      printEditionNumber,
      isActive: true,
      issuedAt: Date.now(),
    });

    // Notify creator of sale
    await ctx.db.insert("notifications", {
      userId: artwork.creatorId,
      type: "sale_completed",
      title: "New sale",
      message: `Your artwork "${artwork.name}" was purchased (${args.selectedLicenseType.replace(/_/g, " ")})`,
      linkTo: "/studio",
      isRead: false,
      createdAt: Date.now(),
    });

    return { purchaseId, licenseId, verificationId };
  },
});

/**
 * Get all purchases for the authenticated buyer.
 */
export const getMyPurchases = query({
  args: { walletAddress: v.string() },
  returns: v.array(v.object({
    _id: v.id("purchases"),
    _creationTime: v.number(),
    artworkId: v.id("artworks"),
    artworkName: v.string(),
    artworkPreviewKey: v.string(),
    licenseType: v.string(),
    deliveryType: v.string(),
    totalPrice: v.number(),
    paymentStatus: v.string(),
    selectedPrintSize: v.optional(v.object({
      label: v.string(),
      widthCm: v.number(),
      heightCm: v.number(),
      priceAddon: v.number(),
    })),
    printEditionNumber: v.optional(v.string()),
    createdAt: v.number(),
    verificationId: v.optional(v.string()),
    orderStatus: v.optional(v.string()),
    courierName: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  })),
  handler: async (ctx: QueryCtx, args) => {
    const buyer = await requireRole(ctx, "user", args.walletAddress);

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .order("desc")
      .take(100);

    return await Promise.all(
      purchases.map(async (purchase) => {
        const artwork = await ctx.db.get(purchase.artworkId);
        // Licenses are 1:1 with purchases — look up by purchaseId directly
        const license = await ctx.db
          .query("licenses")
          .withIndex("by_purchase", (q) => q.eq("purchaseId", purchase._id))
          .unique();

        return {
          _id: purchase._id,
          _creationTime: purchase._creationTime,
          artworkId: purchase.artworkId,
          artworkName: artwork?.name ?? "Unknown",
          artworkPreviewKey: artwork?.r2PreviewKey ?? "",
          licenseType: purchase.licenseType,
          deliveryType: purchase.deliveryType,
          totalPrice: purchase.totalPrice,
          paymentStatus: purchase.paymentStatus,
          selectedPrintSize: purchase.selectedPrintSize,
          printEditionNumber: license?.printEditionNumber,
          createdAt: purchase.createdAt,
          verificationId: license?.verificationId,
          orderStatus: purchase.orderStatus,
          courierName: purchase.courierName,
          trackingNumber: purchase.trackingNumber,
        };
      })
    );
  },
});

/**
 * Aggregate stats for the buyer dashboard.
 */
export const getBuyerStats = query({
  args: { walletAddress: v.string() },
  returns: v.object({
    totalPurchased: v.number(),
    totalSpent: v.number(),
    activeLicenses: v.number(),
  }),
  handler: async (ctx: QueryCtx, args) => {
    const buyer = await requireRole(ctx, "user", args.walletAddress);

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .take(500);

    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .take(500);

    return {
      totalPurchased: purchases.length,
      totalSpent: purchases.reduce((sum, p) => sum + p.totalPrice, 0),
      activeLicenses: licenses.filter((l) => l.isActive).length,
    };
  },
});

/**
 * Get all licenses for the authenticated buyer.
 */
export const getLicensesByBuyer = query({
  args: { walletAddress: v.string() },
  returns: v.array(v.object({
    _id: v.id("licenses"),
    artworkId: v.id("artworks"),
    artworkName: v.string(),
    artworkPreviewKey: v.string(),
    licenseType: v.string(),
    deliveryType: v.string(),
    verificationId: v.string(),
    printEditionNumber: v.optional(v.string()),
    isActive: v.boolean(),
    issuedAt: v.number(),
  })),
  handler: async (ctx: QueryCtx, args) => {
    const buyer = await requireRole(ctx, "user", args.walletAddress);

    const licenses = await ctx.db
      .query("licenses")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .order("desc")
      .take(100);

    return await Promise.all(
      licenses.map(async (license) => {
        const artwork = await ctx.db.get(license.artworkId);
        return {
          _id: license._id,
          artworkId: license.artworkId,
          artworkName: artwork?.name ?? "Unknown",
          artworkPreviewKey: artwork?.r2PreviewKey ?? "",
          licenseType: license.licenseType,
          deliveryType: license.deliveryType,
          verificationId: license.verificationId,
          printEditionNumber: license.printEditionNumber,
          isActive: license.isActive,
          issuedAt: license.issuedAt,
        };
      })
    );
  },
});

/**
 * Public license verification — no auth required.
 * Used by the /verify/[id] page for certificate display.
 */
export const verifyLicense = query({
  args: { verificationId: v.string() },
  returns: v.union(
    v.object({
      verificationId: v.string(),
      artworkName: v.string(),
      artworkPreviewKey: v.string(),
      licenseType: v.string(),
      deliveryType: v.string(),
      buyerWallet: v.string(), // truncated for privacy
      buyerDisplayName: v.optional(v.string()),
      creatorWallet: v.string(),
      creatorDisplayName: v.optional(v.string()),
      printEditionNumber: v.optional(v.string()),
      isActive: v.boolean(),
      issuedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx: QueryCtx, args) => {
    const license = await ctx.db
      .query("licenses")
      .withIndex("by_verification", (q) => q.eq("verificationId", args.verificationId))
      .unique();

    if (!license) return null;

    const artwork = await ctx.db.get(license.artworkId);
    const creator = await ctx.db.get(license.creatorId);
    const buyer = await ctx.db.get(license.buyerId);
    const purchase = await ctx.db.get(license.purchaseId);

    // Infer deliveryType: if purchase has selectedShipping (shipping method chosen), it's physical
    // Otherwise use license's stored value or purchase's value
    let deliveryType = license.deliveryType;
    if (purchase?.selectedShipping) {
      // Has actual shipping data = physical delivery
      deliveryType = "physical";
    } else if (!deliveryType) {
      deliveryType = purchase?.deliveryType ?? "digital";
    }
    deliveryType = deliveryType ?? "digital";

    // Truncate buyer wallet for privacy: show first 4 + last 4
    const w = license.buyerWallet;
    const truncatedWallet = w.length > 10 ? `${w.slice(0, 4)}...${w.slice(-4)}` : w;

    return {
      verificationId: license.verificationId,
      artworkName: artwork?.name ?? "Unknown",
      artworkPreviewKey: artwork?.r2PreviewKey ?? "",
      licenseType: license.licenseType,
      deliveryType: deliveryType,
      buyerWallet: truncatedWallet,
      buyerDisplayName: buyer?.displayName,
      creatorWallet: license.buyerWallet !== creator?.walletAddress ? (creator?.walletAddress ?? "") : "",
      creatorDisplayName: creator?.displayName,
      printEditionNumber: license.printEditionNumber,
      isActive: license.isActive,
      issuedAt: license.issuedAt,
    };
  },
});

/**
 * Total number of purchases for a given artwork.
 * Public — reads the denormalized salesCount field, O(1).
 */
export const getSalesCount = query({
  args: { artworkId: v.id("artworks") },
  returns: v.number(),
  handler: async (ctx: QueryCtx, args) => {
    const artwork = await ctx.db.get(args.artworkId);
    return artwork?.salesCount ?? 0;
  },
});

/**
 * All purchases where the authenticated user is the creator (sales view).
 */
export const getSalesByCreator = query({
  args: { walletAddress: v.string() },
  returns: v.array(v.object({
    _id: v.id("purchases"),
    _creationTime: v.number(),
    artworkId: v.id("artworks"),
    artworkName: v.string(),
    artworkPreviewKey: v.string(),
    buyerWallet: v.string(),
    buyerDisplayName: v.optional(v.string()),
    licenseType: v.string(),
    deliveryType: v.string(),
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
    shippingAddress: v.optional(shippingAddressValidator),
    totalPrice: v.number(),
    createdAt: v.number(),
    orderStatus: v.optional(v.string()),
    courierName: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    statusUpdatedAt: v.optional(v.number()),
  })),
  handler: async (ctx: QueryCtx, args) => {
    const creator = await requireRole(ctx, "creator", args.walletAddress);

    const sales = await ctx.db
      .query("purchases")
      .withIndex("by_creator", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .take(200);

    return await Promise.all(
      sales.map(async (sale) => {
        const artwork = await ctx.db.get(sale.artworkId);
        const buyer = await ctx.db.get(sale.buyerId);

        return {
          _id: sale._id,
          _creationTime: sale._creationTime,
          artworkId: sale.artworkId,
          artworkName: artwork?.name ?? "Unknown",
          artworkPreviewKey: artwork?.r2PreviewKey ?? "",
          buyerWallet: sale.buyerWallet,
          buyerDisplayName: buyer?.displayName,
          licenseType: sale.licenseType,
          deliveryType: sale.deliveryType,
          selectedPrintSize: sale.selectedPrintSize,
          selectedShipping: sale.selectedShipping,
          shippingAddress: sale.shippingAddress,
          totalPrice: sale.totalPrice,
          createdAt: sale.createdAt,
          orderStatus: sale.orderStatus,
          courierName: sale.courierName,
          trackingNumber: sale.trackingNumber,
          statusUpdatedAt: sale.statusUpdatedAt,
        };
      })
    );
  },
});

/**
 * Update order fulfillment status for a physical purchase.
 * Creator-only. Enforces valid status transitions and requires
 * courier + tracking info when marking as shipped.
 */
export const updateOrderStatus = mutation({
  args: {
    walletAddress: v.string(),
    id: v.id("purchases"),
    newStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
    ),
    courierName: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  },
  returns: v.object({ _id: v.id("purchases"), orderStatus: v.string() }),
  handler: async (ctx: MutationCtx, args) => {
    const creator = await requireRole(ctx, "creator", args.walletAddress);

    const purchase = await ctx.db.get(args.id);
    if (!purchase) throw new ConvexError("Purchase not found");
    if (purchase.creatorId !== creator._id) throw new ConvexError("Not authorized to update this order");

    const currentStatus = purchase.orderStatus ?? "pending";
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ["processing"],
      processing: ["shipped", "pending"],
      shipped: ["delivered"],
      delivered: [],
    };
    if (!VALID_TRANSITIONS[currentStatus]?.includes(args.newStatus)) {
      throw new ConvexError(`Cannot transition from ${currentStatus} to ${args.newStatus}`);
    }

    if (args.newStatus === "shipped") {
      if (!args.courierName?.trim()) throw new ConvexError("Courier name is required");
      if (!args.trackingNumber?.trim()) throw new ConvexError("Tracking number is required");
    }

    const patch: Record<string, unknown> = {
      orderStatus: args.newStatus,
      statusUpdatedAt: Date.now(),
    };
    if (args.courierName) patch.courierName = args.courierName.trim();
    if (args.trackingNumber) patch.trackingNumber = args.trackingNumber.trim();

    await ctx.db.patch(args.id, patch);

    // Notify buyer of status change (only for forward transitions, not for reverts)
    if (args.newStatus !== "pending") {
      const artwork = await ctx.db.get(purchase.artworkId);
      const statusMessages: Record<string, { title: string; message: string }> = {
        processing: { title: "Order processing", message: `Your order for "${artwork?.name}" is being prepared` },
        shipped: { title: "Order shipped!", message: `Your order for "${artwork?.name}" is on its way` },
        delivered: { title: "Order delivered", message: `Your order for "${artwork?.name}" has been delivered` },
      };
      const notif = statusMessages[args.newStatus];
      if (notif) {
        await ctx.db.insert("notifications", {
          userId: purchase.buyerId,
          type: `order_${args.newStatus}` as "order_processing" | "order_shipped" | "order_delivered",
          title: notif.title,
          message: notif.message,
          linkTo: "/purchase",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }

    return { _id: args.id, orderStatus: args.newStatus };
  },
});

/**
 * Aggregate stats for the creator sales dashboard.
 */
export const getCreatorStats = query({
  args: { walletAddress: v.string() },
  returns: v.object({
    totalSales: v.number(),
    totalRevenue: v.number(),
    listedCount: v.number(),
    soldArtworksCount: v.number(),
  }),
  handler: async (ctx: QueryCtx, args) => {
    const creator = await requireRole(ctx, "creator", args.walletAddress);

    const sales = await ctx.db
      .query("purchases")
      .withIndex("by_creator", (q) => q.eq("creatorId", creator._id))
      .take(500);

    const listedArtworks = await ctx.db
      .query("artworks")
      .withIndex("by_creator_and_status", (q) =>
        q.eq("creatorId", creator._id).eq("status", "listed")
      )
      .take(200);

    const soldArtworkIds = new Set(sales.map((s) => s.artworkId.toString()));

    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.totalPrice, 0),
      listedCount: listedArtworks.length,
      soldArtworksCount: soldArtworkIds.size,
    };
  },
});
