"use client";

import { useFormContext } from "../MintFormProvider";
import Image from "next/image";
import {
    PaintBrushIcon,
    TextAaIcon,
    ShieldCheckIcon,
} from "@phosphor-icons/react";

const LICENSE_TITLES: Record<string, string> = {
  personal_use: "Personal Use",
  commercial_digital: "Commercial Digital",
  limited_print: "Limited Print",
};

export function Step6Review() {
    const { form } = useFormContext();
    const values = form.getValues();
    const artworkPreviewUrl = values.r2PreviewKey
      ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${values.r2PreviewKey}`
      : null;

    // Default aspect ratio for preview
    const aspectRatio = 4 / 5;

    // Check if any physical license is selected
    const hasPhysicalLicense = values.licenseOptions?.some(
      (opt) => opt.licenseType !== "commercial_digital"
    ) ?? false;

    const REVIEW_DATA = [
        {
            group: "Artwork",
            icon: PaintBrushIcon,
            items: [
                { label: "Title", value: values.name || "" },
                { label: "Symbol", value: values.symbol || "" },
                { label: "Description", value: values.description ? (values.description.slice(0, 50) + (values.description.length > 50 ? "..." : "")) : "" },
            ]
        },
        {
            group: "Details",
            icon: TextAaIcon,
            items: [
                { label: "Tags", value: values.tags.length > 0 ? values.tags.join(", ") : "" },
            ]
        },
    ];

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <h3 className="text-2xl font-medium tracking-tight">Review Your Art</h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-md">
                    Double-check everything before deploying. Your art details, license terms, and pricing are all set.
                </p>
            </div>

            {/* Artwork Preview */}
            {artworkPreviewUrl && (
                <div
                    className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-6 border border-zinc-100 bg-zinc-50/10 overflow-hidden"
                    style={{ animationDelay: "0s", animationFillMode: "both" }}
                >
                    <div className="relative w-full h-60 overflow-hidden" style={{ aspectRatio }}>
                        <Image
                            src={artworkPreviewUrl}
                            alt={values.name || "Artwork preview"}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {REVIEW_DATA.map((section, idx) => {
                    const Icon = section.icon;

                    return (
                        <div
                            key={section.group}
                            className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                            style={{ animationDelay: `${(idx + 1) * 0.1}s`, animationFillMode: "both" }}
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                                    <Icon size={20} weight="thin" />
                                </div>
                                <h4 className="text-base font-pixel uppercase tracking-[0.3em] text-black group-hover:text-black transition-colors">
                                    {section.group}
                                </h4>
                            </div>

                            <div className="space-y-6">
                                {section.items.map((item) => (
                                    item.value && (
                                        <div key={item.label} className="flex justify-between items-baseline group/item">
                                            <span className="text-sm font-pixel uppercase tracking-widest text-zinc-500 group-hover/item:text-zinc-500 transition-colors">
                                                {item.label}
                                            </span>
                                            <span className="text-sm font-medium tracking-tight text-right">
                                                {item.value}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* License Options Section */}
                {values.licenseOptions && values.licenseOptions.length > 0 && (
                    <div
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                        style={{ animationDelay: `${(REVIEW_DATA.length + 1) * 0.1}s`, animationFillMode: "both" }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                                <ShieldCheckIcon size={20} weight="thin" />
                            </div>
                            <h4 className="text-base font-pixel uppercase tracking-[0.3em] text-black">
                                License Options ({values.licenseOptions.length})
                            </h4>
                        </div>

                        <div className="space-y-4">
                            {values.licenseOptions.map((opt, idx) => (
                                <div key={idx} className="p-4 border border-zinc-100 bg-white space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{LICENSE_TITLES[opt.licenseType]}</span>
                                        <span className="font-bold">{opt.price} USD</span>
                                    </div>
                                    {opt.licenseType === "limited_print" && opt.printLimit && (
                                        <p className="text-xs text-zinc-500">Edition: {opt.printLimit} prints</p>
                                    )}
                                    {opt.resaleMinPrice !== undefined && opt.resaleMinPrice > 0 && (
                                        <p className="text-xs text-zinc-500">Min resale: {opt.resaleMinPrice} USD</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Print Sizes Section */}
                {hasPhysicalLicense && values.printSizes && values.printSizes.length > 0 && (
                    <div
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                        style={{ animationDelay: `${(REVIEW_DATA.length + 2) * 0.1}s`, animationFillMode: "both" }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                                <TextAaIcon size={20} weight="thin" />
                            </div>
                            <h4 className="text-base font-pixel uppercase tracking-[0.3em] text-black">
                                Available Print Sizes
                            </h4>
                        </div>

                        <div className="space-y-3">
                            {values.printSizes.map((size, idx) => (
                                <div key={idx} className="flex justify-between items-baseline text-sm">
                                    <span className="text-zinc-600">{size.label}</span>
                                    <span className="text-zinc-500 text-xs">{size.widthCm}×{size.heightCm}cm</span>
                                    <span className="font-medium">+{size.priceAddon} USD</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shipping Rates Section */}
                {hasPhysicalLicense && values.shippingRates && values.shippingRates.length > 0 && (
                    <div
                        className="animate-in fade-in slide-in-from-bottom-2 duration-500 group p-8 border border-zinc-100 bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/30 transition-all"
                        style={{ animationDelay: `${(REVIEW_DATA.length + 3) * 0.1}s`, animationFillMode: "both" }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                                <TextAaIcon size={20} weight="thin" />
                            </div>
                            <h4 className="text-base font-pixel uppercase tracking-[0.3em] text-black">
                                Shipping &amp; Delivery
                            </h4>
                        </div>

                        <div className="space-y-4">
                            {values.shippingRates.map((rate, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-black capitalize">{rate.zone.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-zinc-500">{rate.estimatedDays} days</p>
                                    </div>
                                    <span className="font-medium">{rate.price} USD</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-8 border border-black/5 bg-black/5">
                <div className="flex-1">
                    <p className="text-sm font-medium text-black">Ready to Deploy</p>
                    <p className="text-xs text-zinc-600 leading-relaxed font-light mt-2">
                        Your art is all set. Deploy whenever you&apos;re ready. You can always edit your profile and listing details later.
                    </p>
                </div>
            </div>
        </div>
    );
}
