"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import { useFormContext } from "../MintFormProvider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Step2Details() {
  const { form } = useFormContext();
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  const tags = useWatch({ control, name: "tags", defaultValue: [] });
  const descriptionValue = useWatch({ control, name: "description", defaultValue: "" });
  const detailsDescriptionValue = useWatch({ control, name: "detailsDescription", defaultValue: "" });

  const handleAddTag = (tag: string) => {
    if (tag.trim() && tags.length < 10) {
      setValue("tags", [...tags, tag.trim()]);
    }
  };

  const handleRemoveTag = (index: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h3 className="text-2xl font-medium tracking-tight">
          Artwork Details
        </h3>
        <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-md">
          Add information about your artwork. Fields marked with <span className="text-red-500">*</span> are permanent and cannot be edited.
        </p>
      </div>

      <div className="space-y-10">
        {/* Title & Symbol */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
          <div>
            <label className="text-sm font-pixel uppercase tracking-widest text-black">
              Artwork Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g. Genesis Protocol Alpha"
              className=""
            />
            {errors.name && (
              <div className="flex items-center gap-1.5 text-red-500">
                <WarningCircleIcon size={14} />
                <span className="text-sm uppercase tracking-widest font-pixel">
                  {errors.name.message}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="text-sm font-pixel uppercase tracking-widest text-black">
              Unit Symbol <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("symbol", { required: "Required" })}
              placeholder="e.g. GPT"
              className="text-center uppercase"
            />
          </div>
        </div>

        {/* Short Description (Immutable) */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <label className="text-sm font-pixel uppercase tracking-widest text-black">
                Short Description <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                Brief description that will be permanent and cannot be edited after creation.
              </p>
            </div>
          </div>
          <Textarea
            {...register("description", {
              required: "Description is required",
              maxLength: { value: 150, message: "Maximum 150 characters" },
            })}
            placeholder="Brief overview of your artwork..."
            maxLength={150}
            className="min-h-20 leading-relaxed resize-none"
          />
          <div className="flex justify-end">
           <span className="text-xs text-zinc-400 whitespace-nowrap">
              {descriptionValue?.length || 0}/150
            </span>
          </div>
        </div>

        {/* Long Description (Editable Marketplace) */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-pixel uppercase tracking-widest text-black">
              Details / Long Description
            </label>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Detailed description for the marketplace. Can be edited anytime after creation.
            </p>
          </div>
          <Textarea
            {...register("detailsDescription")}
            placeholder="Share the story, inspiration, and technical details behind your work..."
            className="min-h-40 leading-relaxed resize-y"
            maxLength={1000}
          />
          <div className="flex justify-end">
           <span className="text-xs text-zinc-400 whitespace-nowrap">
              {detailsDescriptionValue?.length || 0}/1000
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 border-b border-zinc-100 pb-6">
          <label className="text-sm font-pixel uppercase tracking-widest text-black">
             Tags
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. Celestial, Abstract, Digital"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              className="flex-1"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 bg-zinc-100 rounded-full flex items-center gap-2"
                >
                  <span className="text-xs">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-zinc-400 hover:text-black transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-zinc-400">
            {tags.length}/10 tags • Help collectors discover your work
          </p>
        </div>

        {/* Original File Link */}
        <div className="space-y-3 border-b border-zinc-100 pb-6">
          <div>
            <label className="text-sm font-pixel uppercase tracking-widest text-black">
              Original File Link
            </label>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Optional link to your original high-resolution file in any format (TIFF, RAW, PNG, etc.). Buyers will receive this link after purchase.
            </p>
          </div>
          <Input
            {...register("originalFileUrl", {
              validate: (value) => {
                if (!value) return true;
                try {
                  new URL(value);
                  return true;
                } catch {
                  return "Please enter a valid URL";
                }
              },
            })}
            type="url"
            placeholder="https://drive.google.com/..."
          />
          {errors.originalFileUrl && (
            <div className="flex items-center gap-1.5 text-red-500">
              <WarningCircleIcon size={14} />
              <span className="text-sm uppercase tracking-widest font-pixel">
                {errors.originalFileUrl.message}
              </span>
            </div>
          )}
        </div>

        {/* Format & Specs */}
        {/* <div className="space-y-4">
          <label className="text-sm font-pixel uppercase tracking-widest text-black">
            Deliverable Formats
          </label>
          <Input
            {...register("format")}
            placeholder="e.g. PNG / PSD / TIFF"
            className=""
          />
          {imageWidth && imageHeight && (
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="px-3 py-1.5 bg-zinc-100 rounded text-xs">
                Resolution: {imageWidth}×{imageHeight}
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 rounded text-xs">
                Aspect: {((imageWidth / imageHeight) * 100) / 100}:1
              </div>
            </div>
          )}
          <p className="text-[10px] text-zinc-400">
            Format auto-detected from upload. Edit to include additional formats.
          </p>
        </div> */}

        {/* Attributes */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 items-start lg:items-center justify-between border-b border-zinc-100 pb-4">
            <div className="space-y-1">
              <label className="text-sm font-pixel uppercase tracking-widest text-black">
                Trait
              </label>
              <p className="text-sm text-black font-light italic">
                Define custom attributes and rarity tiers.
              </p>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => append({ trait_type: "", value: "" })}
            >
              <PlusIcon size={14} /> Add Trait
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-4 group animate-in fade-in slide-in-from-left-2 duration-300"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
                >
                  <div className="flex flex-col lg:flex-row gap-4 flex-1">
                    <Input
                      {...register(`attributes.${index}.trait_type` as const)}
                      placeholder="Type (e.g. Origin)"
                      className="mt-0"
                    />
                    <Input
                      {...register(`attributes.${index}.value` as const)}
                      placeholder="Value (e.g. Solar)"
                      className="mt-0"
                    />
                  </div>

                  <Button
                    variant="ghostDestructive"
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <TrashIcon size={18} weight="thin" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
