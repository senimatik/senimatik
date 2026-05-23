"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import { useFormContext, type LicenseType, type LicenseOptionForm } from "../MintFormProvider";
import {
  LockIcon,
  BriefcaseIcon,
  HashIcon,
  CheckIcon,
  XIcon,
  InfoIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LICENSE_TYPES = [
  {
    value: "personal_use" as const,
    label: "Personal Use (1 to 1 art)",
    icon: LockIcon,
    description: "Non-commercial personal enjoyment. You may resell your license.",
    features: [
      { label: "Transferable", allowed: true },
      { label: "Commercial use", allowed: false },
      { label: "Modification", allowed: false },
      { label: "Resale allowed", allowed: true },
    ],
    hasResaleMin: true,
    hasPrintLimit: false,
  },
  {
    value: "limited_print" as const,
    label: "Limited Edition",
    icon: HashIcon,
    description: "Scarce physical or digital assets. Creator sets a maximum edition count.",
    features: [
      { label: "Transferable", allowed: true },
      { label: "Commercial use", allowed: false },
      { label: "Modification", allowed: false },
      { label: "Resale allowed", allowed: true },
    ],
    hasResaleMin: true,
    hasPrintLimit: true,
  },
  {
    value: "commercial_digital" as const,
    label: "Commercial Digital",
    icon: BriefcaseIcon,
    description: "Commercial rights for digital products and campaigns.",
    features: [
      { label: "Transferable", allowed: false },
      { label: "Commercial use", allowed: true },
      { label: "Modification", allowed: true },
      { label: "Attribution required", allowed: true },
    ],
    hasResaleMin: false,
    hasPrintLimit: false,
  },
] as const;

const PRESET_SIZES = [
  { label: "A5", widthCm: 14.8, heightCm: 21 },
  { label: "A4", widthCm: 21, heightCm: 29.7 },
  { label: "A3", widthCm: 29.7, heightCm: 42 },
  { label: "A2", widthCm: 42, heightCm: 59.4 },
  { label: "12×12\"", widthCm: 30.5, heightCm: 30.5 },
  { label: "16×20\"", widthCm: 40.6, heightCm: 50.8 },
  { label: "24×36\"", widthCm: 61, heightCm: 91.4 },
];

export function Step4License() {
  const { form } = useFormContext();
  const { register, control, setValue, getValues } = form;

  const licenseOptions = useWatch({ control, name: "licenseOptions" }) as LicenseOptionForm[];

  const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
    control,
    name: "printSizes",
  });

  const { fields: shippingFields } = useFieldArray({
    control,
    name: "shippingRates",
  });

  const isSelected = (type: LicenseType) =>
    licenseOptions?.some((opt) => opt.licenseType === type) ?? false;

  const toggleLicense = (type: LicenseType) => {
    const current = getValues("licenseOptions") || [];
    const exists = current.findIndex((opt: LicenseOptionForm) => opt.licenseType === type);

    if (exists >= 0) {
      // Remove
      setValue(
        "licenseOptions",
        current.filter((_: LicenseOptionForm, i: number) => i !== exists)
      );
    } else {
      // Add with default values
      const newOption: LicenseOptionForm = {
        licenseType: type,
        price: 0,
        ...(type === "limited_print" ? { printLimit: 50 } : {}),
      };
      setValue("licenseOptions", [...current, newOption]);
    }
  };

  const getLicenseIndex = (type: LicenseType) =>
    licenseOptions?.findIndex((opt) => opt.licenseType === type) ?? -1;

  const hasLimitedPrint = licenseOptions?.some(
    (opt) => opt.licenseType === "limited_print"
  );

  const hasPhysicalLicense = licenseOptions?.some(
    (opt) => opt.licenseType === "personal_use" || opt.licenseType === "limited_print"
  );

  const addPresetSize = (preset: (typeof PRESET_SIZES)[0]) => {
    appendSize({
      label: preset.label,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      priceAddon: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium mb-1">License Types</h3>
        <p className="text-muted text-base">
          Select one or more license types to offer. Each can have its own price.
          Buyers will choose which license to purchase.
        </p>
      </div>

      {/* License type cards - multi-toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {LICENSE_TYPES.map((tier) => {
          const Icon = tier.icon;
          const isActive = isSelected(tier.value);

          return (
            <button
              key={tier.value}
              type="button"
              onClick={() => toggleLicense(tier.value)}
              className={`p-6 border text-left flex flex-col gap-5 relative overflow-hidden transition-all ${
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200"
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/10" : "bg-black/5"
                }`}
              >
                <Icon size={20} weight="thin" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-medium">{tier.label}</h4>
                <p
                  className={`text-sm leading-relaxed ${
                    isActive ? "text-white/40" : "text-muted"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2">
                    {f.allowed ? (
                      <CheckIcon
                        size={12}
                        weight="bold"
                        className={isActive ? "text-white" : "text-green-500"}
                      />
                    ) : (
                      <XIcon
                        size={12}
                        weight="bold"
                        className={isActive ? "text-white/40" : "text-zinc-300"}
                      />
                    )}
                    <span
                      className={`text-sm ${
                        isActive
                          ? f.allowed
                            ? "text-white"
                            : "text-white/40"
                          : f.allowed
                          ? "text-black"
                          : "text-zinc-300"
                      }`}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Checkmark indicator for selected */}
              {isActive && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <CheckIcon size={14} weight="bold" className="text-green-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Per-license pricing section */}
      {licenseOptions && licenseOptions.length > 0 && (
        <div className="p-8 border border-zinc-100 space-y-8 bg-zinc-50/10 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <InfoIcon size={14} className="text-muted" />
            <span className="text-base font-pixel uppercase tracking-widest">
              Pricing — All amounts in USD
            </span>
          </div>

          {/* Render pricing inputs for each selected license */}
          <div className="space-y-10">
            {licenseOptions.map((option) => {
              const tier = LICENSE_TYPES.find((t) => t.value === option.licenseType);
              if (!tier) return null;
              const idx = getLicenseIndex(option.licenseType);
              if (idx < 0) return null;

              return (
                <div
                  key={option.licenseType}
                  className="bg-white space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <tier.icon size={18} className="text-primary" />
                    <h4 className="font-medium text-primary">{tier.label}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Price */}
                    <div>
                      <label className="text-base font-pixel uppercase tracking-widest text-black">
                        Price
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register(`licenseOptions.${idx}.price`, {
                          valueAsNumber: true,
                        })}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Print Limit (limited_print only) */}
                    {tier.hasPrintLimit && (
                      <div>
                        <label className="text-base font-pixel uppercase tracking-widest text-black">
                          Edition Limit
                        </label>
                        <Input
                          type="number"
                          min={2}
                          max={10000}
                          step={1}
                          {...register(`licenseOptions.${idx}.printLimit`, {
                            valueAsNumber: true,
                          })}
                          placeholder="50"
                        />
                        <p className="text-xs text-muted mt-1">
                          Max prints that can be sold. Min 2.
                        </p>
                      </div>
                    )}

                    {/* Resale Min Price (personal_use, limited_print) */}
                    {tier.hasResaleMin && (
                      <div>
                        <label className="text-base font-pixel uppercase tracking-widest text-black">
                          Min Resale Price
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...register(`licenseOptions.${idx}.resaleMinPrice`, {
                            valueAsNumber: true,
                          })}
                          placeholder="Optional"
                        />
                        <p className="text-xs text-muted mt-1">
                          Floor price for secondary sales.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Print Sizes (shown if any physical license selected) */}
          {hasLimitedPrint && (
            <div className="border-t border-zinc-100 pt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-lg font-pixel uppercase tracking-widest text-black">
                  Available Print Sizes (For Limited Edition license)
                </label>
                <p className="text-sm text-muted">
                  Better to limit to one size only.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                {PRESET_SIZES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addPresetSize(preset)}
                    className="px-3 py-1.5 border border-black/10 text-sm hover:bg-black/5 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    appendSize({
                      label: "",
                      widthCm: 0,
                      heightCm: 0,
                      priceAddon: 0,
                    })
                  }
                  className="text-base font-medium text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  + Custom size
                </button>
              </div>

              <div className="space-y-3 mt-6">
                <div className="grid grid-cols-12 gap-2 items-center text-sm font-pixel uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-100">
                  <div className="col-span-2">Label</div>
                  <div className="col-span-2">Width (cm)</div>
                  <div className="col-span-2">Height (cm)</div>
                  <div className="col-span-5">Price Add (USD)</div>
                  <div className="col-span-1"></div>
                </div>

                <AnimatePresence>
                  {sizeFields.map((field, idx) => (
                    <motion.div
                      key={field.id}
                      exit={{ opacity: 0, x: 10 }}
                      className="grid grid-cols-12 gap-2 items-center animate-in fade-in slide-in-from-left-4 duration-300"
                      style={{
                        animationDelay: `${idx * 0.1}s`,
                        animationFillMode: "both",
                      }}
                    >
                      <div className="col-span-2">
                        <Input
                          {...register(`printSizes.${idx}.label`)}
                          placeholder="A4"
                          className="w-full mt-0"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.1"
                          {...register(`printSizes.${idx}.widthCm`, {
                            valueAsNumber: true,
                          })}
                          placeholder="0"
                          className="w-full mt-0"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.1"
                          {...register(`printSizes.${idx}.heightCm`, {
                            valueAsNumber: true,
                          })}
                          placeholder="0"
                          className="w-full mt-0"
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          step={0.01}
                          {...register(`printSizes.${idx}.priceAddon`, {
                            valueAsNumber: true,
                          })}
                          placeholder="0.00"
                          className="w-full mt-0"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghostDestructive"
                          type="button"
                          onClick={() => removeSize(idx)}
                        >
                          <TrashIcon size={24} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Shipping Rates (shown if personal_use or limited_print selected) */}
          {hasPhysicalLicense && (
            <div className="border-t border-zinc-100 pt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-lg font-pixel uppercase tracking-widest text-black">
                  Shipping &amp; Delivery
                </label>
                <p className="text-sm text-muted">
                  Set courier pricing by destination region. Ships from Malaysia.
                </p>
              </div>

              <div className="space-y-3 mt-6">
                <div className="grid grid-cols-4 gap-2 items-center text-sm font-pixel uppercase tracking-widest text-muted pb-2 border-b border-zinc-100">
                  <div>Region</div>
                  <div>Method</div>
                  <div>Price (USD)</div>
                  <div>Est. Days</div>
                </div>

                {shippingFields.map((field, idx) => {
                  const zoneDisplay = (field.zone || "")
                    .replace(/_/g, " ")
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-4 gap-2 items-center"
                    >
                      <div className="text-base font-medium text-black">
                        {zoneDisplay}
                      </div>
                      <Input
                        {...register(`shippingRates.${idx}.method`)}
                        disabled
                        className="mt-0"
                      />
                      <Input
                        type="number"
                        step={0.01}
                        {...register(`shippingRates.${idx}.price`, {
                          valueAsNumber: true,
                        })}
                        placeholder="0.00"
                        className="mt-0"
                      />
                      <Input
                        {...register(`shippingRates.${idx}.estimatedDays`)}
                        disabled
                        className="mt-0 text-zinc-400"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted">
                Shipping integration coming soon. Prices are manually set for
                now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {(!licenseOptions || licenseOptions.length === 0) && (
        <div className="p-8 border border-dashed border-zinc-200 text-center">
          <p className="text-muted text-base">
            Select at least one license type above to set pricing.
          </p>
        </div>
      )}
    </div>
  );
}
