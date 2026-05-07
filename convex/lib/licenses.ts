import { Doc } from "../_generated/dataModel";

export type LicenseType = "personal_use" | "commercial_digital" | "limited_print";

export interface LicenseOption {
  licenseType: LicenseType;
  price: number;
  printLimit?: number;
  printsMinted?: number;
  resaleMinPrice?: number;
}

/**
 * Get license options from an artwork.
 */
export function getArtworkLicenseOptions(artwork: Doc<"artworks">): LicenseOption[] {
  return artwork.licenseOptions ?? [];
}

/**
 * Find a specific license option by type from an artwork.
 */
export function findLicenseOption(
  artwork: Doc<"artworks">,
  licenseType: LicenseType
): LicenseOption | undefined {
  const options = getArtworkLicenseOptions(artwork);
  return options.find(opt => opt.licenseType === licenseType);
}

/**
 * Get the minimum price across all license options (for "From $X" display).
 */
export function getMinLicensePrice(artwork: Doc<"artworks">): number {
  const options = getArtworkLicenseOptions(artwork);
  if (options.length === 0) return 0;
  return Math.min(...options.map(opt => opt.price));
}

/**
 * Check if any license option is a physical delivery type.
 */
export function hasPhysicalLicense(artwork: Doc<"artworks">): boolean {
  const options = getArtworkLicenseOptions(artwork);
  return options.some(opt =>
    opt.licenseType === "personal_use" ||
    opt.licenseType === "limited_print"
  );
}

/**
 * Check if a license option is sold out.
 * - personal_use: sold out if printsMinted >= 1 (1/1 edition)
 * - limited_print: sold out if printsMinted >= printLimit
 * - commercial_digital: never sold out (unlimited)
 */
export function isLicenseSoldOut(option: LicenseOption): boolean {
  if (option.licenseType === "personal_use") {
    return (option.printsMinted ?? 0) >= 1;
  }
  if (option.licenseType === "limited_print") {
    if (!option.printLimit || option.printLimit === 0) return false;
    return (option.printsMinted ?? 0) >= option.printLimit;
  }
  return false; // commercial_digital is never sold out
}
