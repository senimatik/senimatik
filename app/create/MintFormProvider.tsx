"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

export type LicenseType = "personal_use" | "commercial_digital" | "limited_print";

export interface LicenseOptionForm {
    licenseType: LicenseType;
    price: number;
    printLimit?: number;       // only for limited_print
    resaleMinPrice?: number;   // only for personal_use/limited_print
}

// Pending image (blob stored locally, not yet uploaded)
export interface PendingImage {
    id: string;
    blob: Blob;
    fileName: string;
    preview: string; // object URL for display
}

export interface MintFormValues {
    // Step 1: Artwork - pending upload (blob stored locally)
    pendingPrimaryImage?: PendingImage;

    // Step 1: Supplementary Images - pending upload (blobs stored locally)
    pendingSupplementaryImages: PendingImage[];

    // Step 2: Details
    name: string;
    symbol: string;
    description: string;
    detailsDescription?: string;
    originalFileUrl?: string;
    status: "minted" | "listed";
    attributes: Array<{ trait_type: string; value: string }>;
    tags: string[];

    // Step 3: Collection
    collectionMode: "existing" | "new" | "none";
    collectionId?: string;
    newCollection?: {
        name: string;
        description: string;
    };

    // Step 4: License — Multi-license support
    licenseOptions: LicenseOptionForm[];
    printSizes?: Array<{ label: string; widthCm: number; heightCm: number; priceAddon: number }>;
    shippingRates?: Array<{ zone: string; method: string; price: number; estimatedDays: string }>;

    // Step 5: Royalty
    royaltyBasisPoints: number;
    royaltyRecipients: Array<{ address: string; share: number }>;
}

interface MintFormContextType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<MintFormValues, any, MintFormValues>;
}

const MintFormContext = createContext<MintFormContextType | undefined>(undefined);

export function MintFormProvider({ children }: { children: ReactNode }) {
    const form = useForm<MintFormValues>({
        defaultValues: {
            name: "",
            symbol: "",
            description: "",
            detailsDescription: "",
            status: "minted",
            attributes: [{ trait_type: "", value: "" }],
            tags: [],
            collectionMode: "none",
            // Multi-license: start with empty array, user selects which licenses to offer
            licenseOptions: [],
            printSizes: [],
            shippingRates: [
                { zone: "domestic", method: "Standard", price: 0, estimatedDays: "3-5" },
                { zone: "southeast_asia", method: "Standard", price: 0, estimatedDays: "7-14" },
                { zone: "asia_pacific", method: "Standard", price: 0, estimatedDays: "10-21" },
                { zone: "worldwide", method: "Standard", price: 0, estimatedDays: "14-30" },
            ],
            royaltyBasisPoints: 500, // 5%
            royaltyRecipients: [],
            pendingSupplementaryImages: [],
        },
    });

    return (
        <MintFormContext.Provider value={{ form }}>
            {children}
        </MintFormContext.Provider>
    );
}

export function useFormContext() {
    const context = useContext(MintFormContext);
    if (!context) {
        throw new Error("useFormContext must be used within a MintFormProvider");
    }
    return context;
}

type PrintSizeForm = NonNullable<MintFormValues["printSizes"]>[number];

export function hasLimitedPrintLicense(values: MintFormValues): boolean {
    return values.licenseOptions?.some((opt) => opt.licenseType === "limited_print") ?? false;
}

function isValidPrintSize(size: PrintSizeForm): boolean {
    return (
        !!size.label?.trim() &&
        size.widthCm > 0 &&
        size.heightCm > 0 &&
        size.priceAddon !== undefined &&
        size.priceAddon >= 0
    );
}

/** Step 4 validation: licenses, pricing, and print sizes when Limited Edition is selected. */
export function getStep4LicenseError(values: MintFormValues): string | null {
    if (!values.licenseOptions || values.licenseOptions.length === 0) {
        return "Please select at least one license type in Step 4";
    }

    for (const opt of values.licenseOptions) {
        if (opt.price === undefined || opt.price < 0) {
            return `Please set a valid price for ${opt.licenseType.replace(/_/g, " ")} license`;
        }
        if (opt.licenseType === "limited_print" && (!opt.printLimit || opt.printLimit < 2)) {
            return "Please set an edition limit of at least 2 for Limited Print license";
        }
    }

    if (hasLimitedPrintLicense(values)) {
        const validPrintSizes = (values.printSizes ?? []).filter(isValidPrintSize);
        if (validPrintSizes.length === 0) {
            return "Please add at least one print size in Step 4";
        }
    }

    return null;
}

/** Returns a user-facing error message, or null when the form is ready to deploy. */
export function getMintFormDeployError(values: MintFormValues): string | null {
    if (!values.pendingPrimaryImage) {
        return "Please upload an artwork image in Step 1";
    }

    if (!values.name?.trim()) return "Please enter an artwork name in Step 2";
    if (!values.symbol?.trim()) return "Please enter a unit symbol in Step 2";
    if (!values.description?.trim()) return "Please enter a description in Step 2";

    const step4Error = getStep4LicenseError(values);
    if (step4Error) return step4Error;

    return null;
}

export function isMintFormReadyToDeploy(values: MintFormValues): boolean {
    return getMintFormDeployError(values) === null;
}

/** Check if a specific step is valid/complete */
export function isStepValid(stepId: number, values: MintFormValues): boolean {
    switch (stepId) {
        case 1:
            return !!values.pendingPrimaryImage;
        case 2:
            return !!(values.name?.trim() && values.symbol?.trim() && values.description?.trim());
        case 3:
            // Collection is optional - always valid
            return true;
        case 4:
            return getStep4LicenseError(values) === null;
        case 5:
            // Royalty has defaults - always valid
            return true;
        case 6:
            // Review step - valid if all previous required steps valid
            return isMintFormReadyToDeploy(values);
        default:
            return false;
    }
}
