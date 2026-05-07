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

interface MintFormValues {
    // Step 1: Artwork
    fullImageId?: string;
    previewImageId?: string;
    r2PreviewKey?: string;
    imageType?: string;
    imageFileName?: string;
    imageFileSize?: number;

    // Step 1: Supplementary Images (up to 5, total 10MB)
    supplementaryImages: Array<{
        id: string;
        file: string;
        type: string;
        size: number;
        r2Key: string;
        preview: string;
    }>;

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
            supplementaryImages: [],
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
