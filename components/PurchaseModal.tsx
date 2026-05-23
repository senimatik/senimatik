"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { XIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { useRouter } from "next/navigation";

const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export type LicenseType = "personal_use" | "commercial_digital" | "limited_print";

export interface LicenseOption {
  licenseType: LicenseType;
  price: number;
  printLimit?: number;
  printsMinted?: number;
  resaleMinPrice?: number;
}

export interface ArtworkForModal {
  _id: Id<"artworks">;
  name: string;
  r2PreviewKey: string;
  deliveryType?: string;
  licenseOptions?: LicenseOption[];
  printSizes?: Array<{ label: string; widthCm: number; heightCm: number; priceAddon: number }>;
  shippingRates?: Array<{ zone: string; method: string; price: number; estimatedDays: string }>;
}

interface Props {
  artwork: ArtworkForModal;
  selectedLicenseType: LicenseType;
  selectedPrintSizeIndex: number | null;
  selectedShippingIndex: number | null;
  onClose: () => void;
}

export default function PurchaseModal({
  artwork,
  selectedLicenseType,
  selectedPrintSizeIndex,
  selectedShippingIndex,
  onClose,
}: Props) {
  const walletAddress = useWalletAddress();
  const router = useRouter();
  const purchaseCreate = useMutation(api.purchases.create);

  // Find the selected license option
  const selectedLicense = artwork.licenseOptions?.find(
    opt => opt.licenseType === selectedLicenseType
  ) ?? null;

  const basePrice = selectedLicense?.price ?? 0;
  const profile = useQuery(
    api.users.getShippingProfile,
    walletAddress ? {} : "skip"
  );

  const deliveryType = artwork.deliveryType ?? "digital";
  // Require shipping if: deliveryType says so AND license type is not commercial_digital
  // Commercial digital is always digital-only, never requires shipping
  const requiresShipping = selectedLicenseType !== "commercial_digital" && (deliveryType === "physical" || deliveryType === "both");

  const [step, setStep] = useState<"loading" | "profile_gate" | "review" | "confirm">(
    requiresShipping ? "loading" : "confirm"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ verificationId: string } | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const [addressErrors, setAddressErrors] = useState<Partial<ShippingAddress>>({});

  // When profile loads, check completeness and pre-fill address
  useEffect(() => {
    if (!requiresShipping || profile === undefined) return;

    const saved = profile?.shippingAddress as {
      fullName?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      phone?: string;
    } | undefined;
    const savedPhone = saved?.phone ?? profile?.phone ?? "";
    const isComplete = !!(saved?.fullName && saved?.street && saved?.city && saved?.state && saved?.zipCode && saved?.country && savedPhone);

    if (!isComplete) {
      setStep("profile_gate");
      return;
    }

    // Pre-fill from saved profile
    setAddress({
      fullName: saved!.fullName!,
      street: saved!.street!,
      city: saved!.city!,
      state: saved!.state!,
      zipCode: saved!.zipCode!,
      country: saved!.country!,
      phone: savedPhone,
    });
    setStep("review");
  }, [profile, requiresShipping]);

  const selectedPrintSize =
    selectedPrintSizeIndex !== null && artwork.printSizes
      ? artwork.printSizes[selectedPrintSizeIndex]
      : null;

  const selectedShipping =
    selectedShippingIndex !== null && artwork.shippingRates
      ? artwork.shippingRates[selectedShippingIndex]
      : null;

  const printAddon = selectedPrintSize?.priceAddon ?? 0;
  const shippingCost = selectedShipping?.price ?? 0;
  const totalPrice = basePrice + printAddon + shippingCost;

  function validateAddress(): boolean {
    const errs: Partial<ShippingAddress> = {};
    if (!address.fullName.trim()) errs.fullName = "Required";
    if (!address.street.trim()) errs.street = "Required";
    if (!address.city.trim()) errs.city = "Required";
    if (!address.state.trim()) errs.state = "Required";
    if (!address.zipCode.trim()) errs.zipCode = "Required";
    if (!address.country.trim()) errs.country = "Required";
    if (!address.phone.trim()) errs.phone = "Required";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleConfirm() {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await purchaseCreate({
        walletAddress,
        artworkId: artwork._id,
        selectedLicenseType,
        selectedPrintSizeIndex: selectedPrintSizeIndex ?? undefined,
        selectedShippingIndex: selectedShippingIndex ?? undefined,
        shippingAddress: requiresShipping
          ? {
            fullName: address.fullName,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            phone: address.phone || undefined,
          }
          : undefined,
      });
      setResult({ verificationId: res.verificationId });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Purchase failed";
      setError(raw.replace(/^Uncaught Error:\s*/, "").replace(/^Error:\s*/, ""));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <h2 className="font-pixel text-sm uppercase tracking-widest">
            {result
              ? "License Issued"
              : step === "profile_gate"
                ? "Complete Profile"
                : step === "review"
                  ? "Shipping Details"
                  : step === "loading"
                    ? "Loading..."
                    : "Confirm Purchase"}
          </h2>
          <button
            onClick={onClose}
            className="opacity-40 hover:opacity-100 transition-opacity"
          >
            <XIcon size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* SUCCESS */}
          {result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircleIcon size={32} weight="fill" className="text-green-500" />
              </div>
              <div>
                <p className="font-bold text-lg tracking-tight mb-1">Purchase complete</p>
                <p className="text-sm text-muted">
                  Your license has been issued and is now verifiable.
                </p>
              </div>
              <div className="w-full bg-zinc-50 border border-black/5 p-4 text-left">
                <p className="font-pixel text-xs uppercase tracking-widest text-muted mb-2">
                  Verification ID
                </p>
                <p className="font-mono text-sm font-bold break-all">
                  {result.verificationId}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    router.push(`/verify/${result.verificationId}`);
                    onClose();
                  }}
                  className="w-full bg-primary text-white text-sm font-pixel py-3 hover:bg-primary/80 transition-colors cursor-pointer"
                >
                  View Certificate
                </button>
                <button
                  onClick={() => {
                    router.push("/purchase");
                    onClose();
                  }}
                  className="w-full bg-zinc-50 text-sm font-medium py-3 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  My Purchases
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING: waiting for profile */}
          {!result && step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex items-center justify-center"
            >
              <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            </motion.div>
          )}

          {/* PROFILE GATE: shipping address not set */}
          {!result && step === "profile_gate" && (
            <motion.div
              key="profile_gate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 flex flex-col items-center gap-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <WarningCircleIcon size={32} weight="fill" className="text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-lg mb-1">Complete your profile first</p>
                <p className="text-sm text-muted">
                  Add a shipping address to your profile before purchasing physical artworks.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => { router.push("/settings"); onClose(); }}
                  className="w-full bg-primary text-white text-sm font-medium py-3 hover:bg-primary/80 transition-colors cursor-pointer"
                >
                  Go to Settings
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-sm text-muted py-2 hover:text-black transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: SHIPPING ADDRESS */}
          {!result && step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto"
            >
              {/* Address form */}
              <div className="space-y-3">
                <p className="font-pixel text-sm uppercase tracking-widest text-zinc-400">
                  Shipping Address
                </p>
                <InputField
                  label="Full Name"
                  error={addressErrors.fullName}
                  value={address.fullName}
                  onChange={(v) => setAddress((p) => ({ ...p, fullName: v }))}
                  placeholder="Jane Doe"
                />
                <InputField
                  label="Street Address"
                  error={addressErrors.street}
                  value={address.street}
                  onChange={(v) => setAddress((p) => ({ ...p, street: v }))}
                  placeholder="123 Main St"
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="City"
                    error={addressErrors.city}
                    value={address.city}
                    onChange={(v) => setAddress((p) => ({ ...p, city: v }))}
                    placeholder="New York"
                  />
                  <InputField
                    label="State / Province"
                    error={addressErrors.state}
                    value={address.state}
                    onChange={(v) => setAddress((p) => ({ ...p, state: v }))}
                    placeholder="NY"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Zip / Postal"
                    error={addressErrors.zipCode}
                    value={address.zipCode}
                    onChange={(v) => setAddress((p) => ({ ...p, zipCode: v }))}
                    placeholder="10001"
                  />
                  <InputField
                    label="Country"
                    error={addressErrors.country}
                    value={address.country}
                    onChange={(v) => setAddress((p) => ({ ...p, country: v }))}
                    placeholder="US"
                  />
                </div>
                <InputField
                  label="Phone"
                  error={addressErrors.phone}
                  value={address.phone}
                  onChange={(v) => setAddress((p) => ({ ...p, phone: v }))}
                  placeholder="+1 555 0000"
                />
              </div>

                            {/* Price summary */}
              <div className="bg-zinc-50 border border-black/5 p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">{artwork.name}</span>
                  <span className="font-medium">{basePrice} USD</span>
                </div>
                {selectedPrintSize && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-60">{selectedPrintSize.label}</span>
                    <span>+{printAddon} USD</span>
                  </div>
                )}
                {selectedShipping && (
                  <div className="flex justify-between text-sm capitalize">
                    <span className="opacity-60">{selectedShipping.zone} shipping</span>
                    <span>+{shippingCost} USD</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-black/5">
                  <span>Total</span>
                  <span>{totalPrice} USD</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (validateAddress()) setStep("confirm");
                }}
                className="w-full bg-primary text-white text-sm font-pixel py-3 hover:bg-primary/80 transition-colors cursor-pointer"
              >
                Continue to Purchase
              </button>
            </motion.div>
          )}

          {/* STEP 2: CONFIRM */}
          {!result && step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 flex flex-col gap-5"
            >
              {/* Artwork summary */}
              <div className="flex gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${R2_URL}/${artwork.r2PreviewKey}`}
                  alt={artwork.name}
                  className="w-16 h-16 object-cover shrink-0 bg-zinc-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{artwork.name}</p>
                  <p className="text-sm text-muted capitalize mt-0.5">
                    {selectedLicenseType.replace(/_/g, " ")} license
                  </p>
                  <p className="text-sm text-muted capitalize">Delivery: {deliveryType}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-zinc-50 border border-black/5 p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Base price</span>
                  <span>{basePrice} USD</span>
                </div>
                {selectedPrintSize && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{selectedPrintSize.label} print</span>
                    <span>+{printAddon} USD</span>
                  </div>
                )}
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted capitalize">
                      {selectedShipping.zone} ({selectedShipping.estimatedDays}d)
                    </span>
                    <span>+{shippingCost} USD</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-black/5">
                  <span>Total</span>
                  <span>{totalPrice} USD</span>
                </div>
              </div>

              {/* Shipping address summary */}
              {requiresShipping && (
                <div className="bg-zinc-50 border border-black/5 p-4 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-pixel text-sm uppercase tracking-widest text-primary">
                      Ships to
                    </p>
                    <button
                      onClick={() => setStep("review")}
                      className="font-pixel text-sm uppercase tracking-widest text-muted hover:text-primary hover:underline transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-medium">{address.fullName}</p>
                  <p className="text-zinc-500">
                    {address.street}, {address.city}, {address.state} {address.zipCode},{" "}
                    {address.country}
                  </p>
                  {address.phone && <p className="text-zinc-500">{address.phone}</p>}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3">
                  {error}
                </p>
              )}

              {/* <p className="text-[10px] text-zinc-400 text-center">
                Simulated purchase — license issued instantly.
              </p> */}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full bg-primary text-white text-sm font-pixel py-3 hover:bg-primary/80 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoading
                    ? "Processing..."
                    : `Confirm Purchase · ${totalPrice} USD`}
                </button>
                {requiresShipping && (
                  <button
                    onClick={() => setStep("review")}
                    className="w-full text-sm text-zinc-400 py-2 hover:text-black transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function InputField({
  label,
  error,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-pixel text-xs text-primary uppercase tracking-widest mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-black/10 px-3 py-2 text-sm focus:outline-none focus:border-black/40 transition-colors bg-white"
      />
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
