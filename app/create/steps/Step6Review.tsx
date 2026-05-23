"use client";

import {
    useFormContext,
    isMintFormReadyToDeploy,
    getMintFormDeployError,
    hasLimitedPrintLicense,
} from "../MintFormProvider";
import Image from "next/image";
import {
    PaintBrushIcon,
    TextAaIcon,
    ShieldCheckIcon,
    TruckIcon,
    FolderIcon,
    CoinsIcon,
    FileIcon,
} from "@phosphor-icons/react";

const LICENSE_TITLES: Record<string, string> = {
    personal_use: "Personal Use",
    commercial_digital: "Commercial Digital",
    limited_print: "Limited Print",
};

function nonEmpty(value: string | undefined): string {
    return value?.trim() ?? "";
}

export function Step6Review() {
    const { form } = useFormContext();
    const values = form.watch();

    const artworkPreviewUrl = values.pendingPrimaryImage?.preview ?? null;

    const aspectRatio = 4 / 5;

    const hasLimitedPrint = hasLimitedPrintLicense(values);
    const hasPhysicalLicense = values.licenseOptions?.some(
        (opt) => opt.licenseType === "personal_use" || opt.licenseType === "limited_print"
    ) ?? false;

    const isReadyToDeploy = isMintFormReadyToDeploy(values);
    const deployError = getMintFormDeployError(values);

    const description = nonEmpty(values.description);
    const reviewSections = [
        {
            group: "Details",
            icon: TextAaIcon,
            items: [
                { label: "Title", value: nonEmpty(values.name) },
                { label: "Symbol", value: nonEmpty(values.symbol) },
                {
                    label: "Description",
                    value: description
                        ? description.slice(0, 50) + (description.length > 50 ? "..." : "")
                        : "",
                },
                {
                    label: "Tags",
                    value: values.tags.length > 0 ? values.tags.join(", ") : "",
                },
            ],
        },
    ]
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => item.value),
        }))
        .filter((section) => section.items.length > 0);

    const hasLicenseSection = (values.licenseOptions?.length ?? 0) > 0;
    const hasPrintSection =
        hasLimitedPrint &&
        (values.printSizes?.some(
            (size) => size.label?.trim() && size.widthCm > 0 && size.heightCm > 0
        ) ?? false);
    const hasShippingSection = hasPhysicalLicense && (values.shippingRates?.length ?? 0) > 0;
    const hasReviewContent =
        !!artworkPreviewUrl ||
        reviewSections.length > 0 ||
        hasLicenseSection ||
        hasPrintSection ||
        hasShippingSection;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-medium mb-1">Review Your Art</h3>
                <p className="text-muted text-base">
                    {isReadyToDeploy
                        ? "Double-check everything before deploying. Your art details, license terms, and pricing are all set."
                        : "Complete the steps above, then return here to review your listing before you deploy."}
                </p>
            </div>

            {artworkPreviewUrl && (
                <div
                    className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-8 border border-zinc-100 bg-zinc-50/10 overflow-hidden"
                    style={{ animationDelay: "0s", animationFillMode: "both" }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                            <PaintBrushIcon size={20} weight="thin" />
                        </div>
                        <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                            Artwork
                        </h4>
                    </div>
                    <div className="relative w-full h-60 overflow-hidden" style={{ aspectRatio }}>
                        <Image
                            src={artworkPreviewUrl}
                            alt={nonEmpty(values.name) || "Artwork preview"}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>
                </div>
            )}

            {hasReviewContent && (
                <div className="grid grid-cols-1 gap-6">
                    {reviewSections.map((section, idx) => {
                        const Icon = section.icon;

                        return (
                            <div
                                key={section.group}
                                className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                                style={{
                                    animationDelay: `${(idx + 1) * 0.1}s`,
                                    animationFillMode: "both",
                                }}
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                        <Icon size={20} weight="thin" />
                                    </div>
                                    <h4 className="text-base font-pixel uppercase tracking-widest text-black group-hover:text-black transition-colors">
                                        {section.group}
                                    </h4>
                                </div>

                                <div className="space-y-6">
                                    {section.items.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex justify-between items-baseline group/item"
                                        >
                                            <span className="text-base text-muted">
                                                {item.label}
                                            </span>
                                            <span className="text-base font-medium tracking-tight text-right">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {hasLicenseSection && values.licenseOptions && (
                        <div
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                            style={{
                                animationDelay: `${(reviewSections.length + 1) * 0.1}s`,
                                animationFillMode: "both",
                            }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                    <ShieldCheckIcon size={20} weight="thin" />
                                </div>
                                <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                                    License Options ({values.licenseOptions.length})
                                </h4>
                            </div>

                            <div className="space-y-4">
                                {values.licenseOptions.map((opt, idx) => (
                                    <div key={idx} className="p-4 border border-zinc-100 bg-white space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-medium">{LICENSE_TITLES[opt.licenseType]}</span>
                                            <span className="text-base font-bold">{opt.price} USD</span>
                                        </div>
                                        {opt.licenseType === "limited_print" && opt.printLimit && (
                                            <p className="text-sm text-muted">Edition: {opt.printLimit} prints</p>
                                        )}
                                        {opt.resaleMinPrice !== undefined && opt.resaleMinPrice > 0 && (
                                            <p className="text-sm text-muted">Min resale: {opt.resaleMinPrice} USD</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasPrintSection && values.printSizes && (
                        <div
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                            style={{
                                animationDelay: `${(reviewSections.length + 2) * 0.1}s`,
                                animationFillMode: "both",
                            }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                    <FileIcon size={20} weight="thin" />
                                </div>
                                <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                                    Available Print Sizes
                                </h4>
                            </div>

                            <div className="space-y-3">
                                {values.printSizes.map((size, idx) => (
                                    <div key={idx} className="flex justify-between items-baseline text-base">
                                        <span className="text-muted text-base">{size.label}</span>
                                        <span className="text-muted text-base">
                                            {size.widthCm}×{size.heightCm}cm
                                        </span>
                                        <span className="font-medium text-base">+{size.priceAddon} USD</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasShippingSection && values.shippingRates && (
                        <div
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                            style={{
                                animationDelay: `${(reviewSections.length + 3) * 0.1}s`,
                                animationFillMode: "both",
                            }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                    <TruckIcon size={20} weight="thin" />
                                </div>
                                <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                                    Shipping &amp; Delivery
                                </h4>
                            </div>

                            <div className="space-y-4">
                                {values.shippingRates.map((rate, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between items-center text-sm border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="font-medium text-black capitalize">
                                                {rate.zone.replace(/_/g, " ")}
                                            </p>
                                            <p className="text-sm text-muted">{rate.estimatedDays} days</p>
                                        </div>
                                        <span className="font-medium text-base">{rate.price} USD</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Collection Section */}
                    <div
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                        style={{
                            animationDelay: `${(reviewSections.length + 4) * 0.1}s`,
                            animationFillMode: "both",
                        }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                <FolderIcon size={20} weight="thin" />
                            </div>
                            <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                                Collection
                            </h4>
                        </div>

                        <div className="space-y-2">
                            {values.collectionMode === "none" ? (
                                <div className="flex justify-between items-baseline">
                                    <span className="text-base text-muted">Type</span>
                                    <span className="text-base font-medium">Solo Art</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-base text-muted">Type</span>
                                        <span className="text-base font-medium capitalize">{values.collectionMode}</span>
                                    </div>
                                    {values.collectionMode === "new" && values.newCollection?.name && (
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-base text-muted">Name</span>
                                            <span className="text-base font-medium">{values.newCollection.name}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Royalties Section */}
                    <div
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                        style={{
                            animationDelay: `${(reviewSections.length + 5) * 0.1}s`,
                            animationFillMode: "both",
                        }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center">
                                <CoinsIcon size={20} weight="thin" />
                            </div>
                            <h4 className="text-base font-pixel uppercase tracking-widest text-black">
                                Royalties
                            </h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-base text-muted">Royalty Rate</span>
                                <span className="text-base font-medium">{(values.royaltyBasisPoints / 100).toFixed(1)}%</span>
                            </div>
                            {values.royaltyRecipients && values.royaltyRecipients.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-base text-muted">Recipients</span>
                                    {values.royaltyRecipients.map((r, idx) => (
                                        <div key={idx} className="flex justify-between items-baseline text-base">
                                            <span className="text-black font-mono truncate max-w-50">{r.address.slice(0, 4)}...{r.address.slice(-4)}</span>
                                            <span className="font-medium">{r.share}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isReadyToDeploy && deployError && (
                <p className="text-base text-red-500">{deployError}</p>
            )}

            {isReadyToDeploy && (
                <div className="p-8 border border-black/5 bg-black/5">
                    <div className="flex-1">
                        <p className="text-lg font-medium text-black">Ready to Deploy</p>
                        <p className="text-base text-muted mt-2">
                            Your art is all set. Deploy whenever you&apos;re ready. You can always edit your
                            profile and listing details later.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
