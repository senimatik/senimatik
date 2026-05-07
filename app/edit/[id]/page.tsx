"use client";

import React, { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { ArrowLeftIcon, TrashIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { useDropzone } from "react-dropzone";
import { CloudArrowUpIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
import { convertToWebP } from "@/lib/image-processing";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_SUPPLEMENTARY_IMAGES = 5;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB

const DEFAULT_SHIPPING_RATES = [
  { zone: "domestic", method: "Standard", price: 0, estimatedDays: "3-5" },
  { zone: "southeast_asia", method: "Standard", price: 0, estimatedDays: "7-14" },
  { zone: "asia_pacific", method: "Standard", price: 0, estimatedDays: "10-21" },
  { zone: "worldwide", method: "Standard", price: 0, estimatedDays: "14-30" },
];

interface SupplementaryImage {
  file: string;
  type: string;
  size: number;
  r2Key: string;
}

type LicenseType = "personal_use" | "commercial_digital" | "limited_print";

interface LicenseOptionForm {
  licenseType: LicenseType;
  price: number;
  printLimit?: number;
  resaleMinPrice?: number;
}

interface EditFormValues {
  licenseOptions: LicenseOptionForm[];
  tags: string[];
  detailsDescription?: string;
  attributes: Array<{ trait_type: string; value: string }>;
  collectionMode?: "existing" | "new" | "none";
  collectionId?: string;
  newCollection?: { name: string; description: string };
  supplementaryImages?: SupplementaryImage[];
  printSizes?: Array<{ label: string; widthCm: number; heightCm: number; priceAddon: number }>;
  shippingRates?: Array<{ zone: string; method: string; price: number; estimatedDays: string }>;
}

// Common print sizes for quick-add
const PRESET_SIZES = [
  { label: "A5", widthCm: 14.8, heightCm: 21 },
  { label: "A4", widthCm: 21, heightCm: 29.7 },
  { label: "A3", widthCm: 29.7, heightCm: 42 },
  { label: "A2", widthCm: 42, heightCm: 59.4 },
  { label: "12×12\"", widthCm: 30.5, heightCm: 30.5 },
  { label: "16×20\"", widthCm: 40.6, heightCm: 50.8 },
  { label: "24×36\"", widthCm: 61, heightCm: 91.4 },
];

// Sortable Image Item Component (matching create flow)
function SortableImageItem({
  image,
  onDelete,
}: {
  image: SupplementaryImage;
  onDelete: (r2Key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.r2Key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Construct image URL from R2 key
  const imageUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${image.r2Key}`;
  const sizeInMB = image.size > 0 ? (image.size / 1024 / 1024).toFixed(1) : "0.0";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square bg-zinc-100 overflow-hidden border border-black/5 hover:border-black/20 transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={image.file} className="w-full h-full object-cover" />

      {/* Image info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
        <p className="text-[9px] text-white truncate">{image.file}</p>
        <p className="text-[8px] text-white/70">{sizeInMB}MB</p>
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <DotsSixVerticalIcon size={14} weight="bold" className="text-white" />
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(image.r2Key)}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TrashIcon size={14} weight="bold" className="text-white" />
      </button>
    </div>
  );
}

// Supplementary Images Section Component
function SupplementaryImagesSection({
  supplementaryImages,
  onUpdate,
  walletAddress,
}: {
  supplementaryImages: SupplementaryImage[];
  onUpdate: (images: SupplementaryImage[]) => void;
  walletAddress: string | null;
}) {
  const generateUrl = useMutation(api.r2.generateArtworkUploadUrl);
  const deleteFromR2 = useMutation(api.r2.deleteFromR2);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalSize = supplementaryImages.reduce((sum, img) => sum + img.size, 0);
  const remainingSize = MAX_TOTAL_SIZE - totalSize;
  const canAddMore = supplementaryImages.length < MAX_SUPPLEMENTARY_IMAGES && remainingSize > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddImages = React.useCallback(
    async (files: File[]) => {
      setError(null);
      setUploading(true);

      try {
        if (!walletAddress) {
          setError("Wallet not connected");
          return;
        }

        let runningTotal = totalSize;
        const newImages: SupplementaryImage[] = [];

        for (const file of files) {
          const webpBlob = await convertToWebP(file);

          if (runningTotal + webpBlob.size > MAX_TOTAL_SIZE) {
            const remaining = (MAX_TOTAL_SIZE - runningTotal) / 1024 / 1024;
            setError(`Cannot add image. Total size would exceed 10MB. ${remaining.toFixed(1)}MB remaining.`);
            break;
          }

          const webpFileName = `supp_${Date.now()}_${file.name.replace(/\.[^.]+$/, "")}.webp`;

          const uploadRes = await generateUrl({
            walletAddress,
            type: "details",
            fileName: webpFileName,
          });

          const uploadResp = await fetch(uploadRes.url, {
            method: "PUT",
            body: webpBlob,
            headers: { "Content-Type": "image/webp" },
          });

          if (!uploadResp.ok) {
            throw new Error(`Upload failed: ${uploadResp.statusText}`);
          }

          runningTotal += webpBlob.size;
          newImages.push({
            file: file.name,
            type: "image/webp",
            size: webpBlob.size,
            r2Key: uploadRes.key,
          });
        }

        if (newImages.length > 0) {
          onUpdate([...supplementaryImages, ...newImages]);
        }
      } catch (err) {
        setError("Upload failed. Please try again.");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [supplementaryImages, totalSize, generateUrl, onUpdate, walletAddress]
  );

  const handleDeleteImage = React.useCallback(
    async (r2Key: string) => {
      if (!walletAddress) {
        console.error("Wallet not connected");
        return;
      }

      try {
        await deleteFromR2({ walletAddress, keys: [r2Key] });
        onUpdate(supplementaryImages.filter((img) => img.r2Key !== r2Key));
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    },
    [supplementaryImages, deleteFromR2, onUpdate, walletAddress]
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = supplementaryImages.findIndex((img) => img.r2Key === active.id);
        const newIndex = supplementaryImages.findIndex((img) => img.r2Key === over.id);
        onUpdate(arrayMove(supplementaryImages, oldIndex, newIndex));
      }
    },
    [supplementaryImages, onUpdate]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleAddImages,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: MAX_SUPPLEMENTARY_IMAGES - supplementaryImages.length,
    maxSize: remainingSize,
    disabled: !canAddMore || uploading,
  });

  return (
    <section className="space-y-6 pb-8 border-b border-black/5">
      <div>
        <label className="text-sm font-pixel uppercase tracking-widest text-black">
          Supplementary Images
        </label>
        <p className="text-xs text-zinc-400 leading-relaxed mt-1">
          Add up to {MAX_SUPPLEMENTARY_IMAGES} additional images. Max {MAX_TOTAL_SIZE / 1024 / 1024}MB total. Auto-converted to WebP.
        </p>
      </div>

      {/* Images grid with drag-drop - appears at TOP */}
      {supplementaryImages.length > 0 && (
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={supplementaryImages.map((img) => img.r2Key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {supplementaryImages.map((image) => (
                  <SortableImageItem
                    key={image.r2Key}
                    image={image}
                    onDelete={handleDeleteImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-xs text-zinc-400">
            {supplementaryImages.length}/{MAX_SUPPLEMENTARY_IMAGES} images
          </p>
        </div>
      )}

      {/* Upload dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          canAddMore && !uploading
            ? "border-zinc-300 hover:border-black/30 cursor-pointer"
            : "border-zinc-200 bg-zinc-50/30 cursor-not-allowed opacity-60"
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon size={32} className="mx-auto mb-2 text-zinc-400" />
        <p className="text-sm font-medium">
          {uploading ? "Uploading..." : "Drag images here or click to browse"}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          {(remainingSize / 1024 / 1024).toFixed(1)}MB remaining
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}

export default function EditArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const walletAddress = useWalletAddress();

  const { register, handleSubmit, control, getValues, reset, setValue } = useForm<EditFormValues>({
    defaultValues: {
      licenseOptions: [],
      tags: [],
      detailsDescription: "",
      attributes: [{ trait_type: "", value: "" }],
      collectionMode: "none",
      printSizes: [],
      shippingRates: [],
    },
  });

  const collectionMode = useWatch({ control, name: "collectionMode" });
  const tags = useWatch({ control, name: "tags", defaultValue: [] });
  const supplementaryImages = useWatch({ control, name: "supplementaryImages", defaultValue: [] });

  const {
    fields: licenseOptionFields,
  } = useFieldArray({
    control,
    name: "licenseOptions",
  });

  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({
    control,
    name: "attributes",
  });

  const {
    fields: printSizeFields,
    append: appendPrintSize,
    remove: removePrintSize,
  } = useFieldArray({
    control,
    name: "printSizes",
  });

  const {
    fields: shippingFields,
  } = useFieldArray({
    control,
    name: "shippingRates",
  });

  // Fetch artwork data
  const artwork = useQuery(api.artworks.getById, {
    id: id as Id<"artworks">,
  });

  // Fetch collections for the creator
  const collections = useQuery(api.artworks.getCollectionsByCreator, {
    walletAddress: walletAddress || "",
  });

  const updateMutation = useMutation(api.artworks.update);

  // Populate form when artwork loads
  useEffect(() => {
    if (artwork) {
      const licenseOpts = (artwork.licenseOptions || []).map(opt => ({
        licenseType: opt.licenseType as LicenseType,
        price: opt.price,
        printLimit: opt.printLimit,
        resaleMinPrice: opt.resaleMinPrice,
      }));

      reset({
        licenseOptions: licenseOpts,
        tags: artwork.tags || [],
        detailsDescription: artwork.detailsDescription || "",
        attributes: artwork.attributes || [],
        supplementaryImages: artwork.supplementaryImages || [],
        printSizes: artwork.printSizes || [],
        shippingRates: (artwork.shippingRates && artwork.shippingRates.length > 0)
          ? artwork.shippingRates
          : DEFAULT_SHIPPING_RATES,
        collectionMode: artwork.collectionId ? "existing" : "none",
        collectionId: artwork.collectionId,
      });
    }
  }, [artwork, reset]);

  const handleSupplementaryUpdate = useCallback(
    (images: SupplementaryImage[]) => setValue("supplementaryImages", images),
    [setValue]
  );

  const addPresetSize = (preset: typeof PRESET_SIZES[0]) => {
    appendPrintSize({
      label: preset.label,
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      priceAddon: 0,
    });
  };

  const onSubmit = async (data: EditFormValues) => {
    try {
      if (!walletAddress) {
        toast.error("Wallet not connected");
        return;
      }

      // Filter out physical-only fields for commercial_digital licenses
      // Check if any physical license is selected
      const hasPhysicalLicense = data.licenseOptions?.some(
        opt => opt.licenseType !== "commercial_digital"
      ) ?? false;

      const updateData: Parameters<typeof updateMutation>[0] = {
        id: id as Id<"artworks">,
        walletAddress,
        licenseOptions: data.licenseOptions,
        tags: data.tags,
        detailsDescription: data.detailsDescription,
        attributes: data.attributes,
        supplementaryImages: data.supplementaryImages,
        printSizes: hasPhysicalLicense ? data.printSizes : [],
        shippingRates: hasPhysicalLicense ? data.shippingRates : [],
        collectionMode: (data.collectionMode === "new" && !data.newCollection?.name) ||
          (data.collectionMode === "existing" && !data.collectionId)
          ? "none"
          : data.collectionMode,
      };

      if (data.collectionMode === "existing" && data.collectionId) {
        updateData.collectionId = data.collectionId as Id<"collections">;
      } else if (data.collectionMode === "new" && data.newCollection?.name) {
        updateData.newCollection = {
          name: data.newCollection.name,
          description: data.newCollection.description || "",
        };
      }

      await updateMutation(updateData);

      toast.success("Artwork updated successfully");
      router.back();
    } catch (err) {
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (!artwork || !walletAddress) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <p className="text-zinc-500">Loading artwork...</p>
        </div>
        <Footer variant="dark" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar variant="dark" />

      <div className="flex-1 max-w-4xl mx-auto w-full mt-10 lg:mt-20 px-4 lg:px-12 xl:px-0 mb-20">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeftIcon size={16} /> Back
        </Button>
        <h1 className="text-4xl font-medium tracking-tight text-black mb-2">Edit Artwork</h1>
        <p className="text-zinc-500 mb-12">Update marketplace details for your artwork.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* License Pricing */}
          <section className="space-y-6 pb-8 border-b border-black/5">
            <h2 className="text-2xl font-medium">License Pricing</h2>
            <p className="text-sm text-zinc-500">
              Update prices for each license type offered with this artwork.
            </p>

            <div className="space-y-4">
              {licenseOptionFields.map((field, idx) => {
                const licenseLabel = field.licenseType === "personal_use" ? "Personal Use"
                  : field.licenseType === "commercial_digital" ? "Commercial Digital"
                  : field.licenseType === "limited_print" ? "Limited Print"
                  : field.licenseType;
                const showResaleMin = field.licenseType === "personal_use" || field.licenseType === "limited_print";

                return (
                  <div key={field.id} className="p-4 border border-zinc-100 bg-zinc-50/50 space-y-4">
                    <h3 className="font-medium">{licenseLabel}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-pixel uppercase tracking-widest text-zinc-500 mb-2">
                          Price (USD)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          {...register(`licenseOptions.${idx}.price`, { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      {showResaleMin && (
                        <div>
                          <label className="block text-xs font-pixel uppercase tracking-widest text-zinc-500 mb-2">
                            Min Resale Price (USD)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...register(`licenseOptions.${idx}.resaleMinPrice`, { valueAsNumber: true })}
                            placeholder="Optional"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Original Description (Read-only) */}
          <section className="space-y-6 pb-8 border-b border-black/5">
            <div className="space-y-4">
              <label className="text-sm font-pixel uppercase tracking-widest text-black">
                Original Description <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Description set during creation. Cannot be edited.
              </p>
              <div className="w-full px-4 py-3 border border-black/10 min-h-24 bg-zinc-50/50 text-zinc-600 leading-relaxed">
                {artwork?.description}
              </div>
            </div>
          </section>

          {/* Marketplace Description (Editable) */}
          <section className="space-y-6 pb-8 border-b border-black/5">
            <div className="space-y-4">
              <label className="text-sm font-pixel uppercase tracking-widest text-black">
                Details / Long Description
              </label>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Edit the detailed description that appears on the marketplace. Can be changed anytime.
              </p>
              <textarea
                {...register("detailsDescription")}
                placeholder="Share the story, inspiration, and technical details behind your work..."
                className="w-full px-4 py-3 border border-black/10 min-h-32 resize-y focus:outline-none focus:border-black/30"
              />
            </div>
          </section>

          {/* Tags */}
          <section className="space-y-6">
            <div className="space-y-4 border-b border-black/5 pb-8">
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
                      const input = e.target as HTMLInputElement;
                      const tag = input.value.trim();
                      const currentTags = getValues("tags") || [];
                      if (tag && currentTags.length < 10 && !currentTags.includes(tag)) {
                        setValue("tags", [...currentTags, tag]);
                        input.value = "";
                      }
                    }
                  }}
                  className="flex-1"
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-zinc-100 rounded-full flex items-center gap-2"
                    >
                      <span className="text-xs">{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentTags = getValues("tags") || [];
                          setValue(
                            "tags",
                            currentTags.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-zinc-400 hover:text-black transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-400">
                {tags.length}/10 tags • Help collectors discover your work
              </p>
            </div>
          </section>

          {/* Supplementary Images */}
          <SupplementaryImagesSection
            supplementaryImages={supplementaryImages || []}
            onUpdate={handleSupplementaryUpdate}
            walletAddress={walletAddress}
          />

          {/* Traits */}
          <section className="space-y-6 pb-8 border-b border-black/5">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-medium">Traits</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAttribute({ trait_type: "", value: "" })}
              >
                Add Trait
              </Button>
            </div>
            <div className="space-y-3">
              {attributeFields.map((field, idx) => (
                <div key={field.id} className="flex gap-3">
                  <Input
                    {...register(`attributes.${idx}.trait_type`)}
                    placeholder="Trait type"
                    className="flex-1 mt-0"
                  />
                  <Input
                    {...register(`attributes.${idx}.value`)}
                    placeholder="Value"
                    className="flex-1 mt-0"
                  />
                  <Button
                    variant="ghostDestructive"
                    type="button"
                    onClick={() => removeAttribute(idx)}
                  >
                    <TrashIcon size={20} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Collection */}
          <section className="space-y-6 pb-8 border-b border-black/5">
            <h2 className="text-2xl font-medium">Collection</h2>
            <div className="space-y-4">
              {/* Collection mode selection */}
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("collectionMode")}
                    value="none"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">No Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("collectionMode")}
                    value="existing"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Existing Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("collectionMode")}
                    value="new"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Create New</span>
                </label>
              </div>

              {/* Existing collection selector */}
              {collectionMode === "existing" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Collection</label>
                  <select
                    {...register("collectionId")}
                    className="w-full px-3 py-2 border border-black/10"
                  >
                    <option value="">Choose a collection...</option>
                    {collections?.map((collection) => (
                      <option key={collection._id} value={collection._id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* New collection form */}
              {collectionMode === "new" && (
                <div className="space-y-4 p-4 bg-zinc-50/50 border border-zinc-100">
                  <div>
                    <label className="block text-sm font-medium mb-2">Collection Name</label>
                    <Input
                      {...register("newCollection.name")}
                      placeholder="e.g., Summer Series"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      {...register("newCollection.description")}
                      placeholder="Collection description (optional)"
                      className="w-full px-3 py-2 border border-black/10 min-h-20"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Print Sizes - Only show for non-commercial licenses */}
          {artwork?.licenseOptions?.some(opt => opt.licenseType !== "commercial_digital") && (
          <section className="space-y-6 pb-8 border-b border-black/5">
            <div className="space-y-1">
              <label className="text-lg font-pixel uppercase tracking-widest text-black">
                Available Print Sizes
              </label>
              <p className="text-sm text-zinc-400">
                Define the physical sizes buyers can order.
              </p>
            </div>

            {/* Preset quick-add buttons */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => addPresetSize(preset)}
                    className="px-3 py-1.5 border border-black/10 rounded text-sm hover:bg-black/5 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}

                {/* Custom size input */}
                <button
                  type="button"
                  onClick={() =>
                    appendPrintSize({
                      label: "",
                      widthCm: 0,
                      heightCm: 0,
                      priceAddon: 0,
                    })
                  }
                  className="text-sm font-medium text-zinc-600 hover:text-black transition-colors cursor-pointer"
                >
                  + Add custom size
                </button>
              </div>
            </div>

            {/* Size rows */}
            <div className="space-y-3">
              {/* Headers */}
              <div className="grid grid-cols-12 gap-2 items-center text-xs font-pixel uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-100 mt-6">
                <div className="col-span-2">Label</div>
                <div className="col-span-2">Width (cm)</div>
                <div className="col-span-2">Height (cm)</div>
                <div className="col-span-5">Price Add (USDC)</div>
                <div className="col-span-1"></div>
              </div>

              {/* Size rows */}
              <AnimatePresence>
                {printSizeFields.map((field, idx) => (
                  <motion.div
                    key={field.id}
                    exit={{ opacity: 0, x: 10 }}
                    className="grid grid-cols-12 gap-2 items-center animate-in fade-in slide-in-from-left-2 duration-300"
                    style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
                  >
                    <div className="col-span-2">
                      <Input
                        {...register(`printSizes.${idx}.label`)}
                        placeholder="e.g., A4"
                        className="w-full mt-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        {...register(`printSizes.${idx}.widthCm`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full mt-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        {...register(`printSizes.${idx}.heightCm`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full mt-0"
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        step={0.01}
                        {...register(`printSizes.${idx}.priceAddon`, { valueAsNumber: true })}
                        placeholder="0.00"
                        className="w-full mt-0"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghostDestructive"
                        type="button"
                        onClick={() => removePrintSize(idx)}
                      >
                        <TrashIcon size={20} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
          )}

          {/* Shipping Rates - Only show for non-commercial licenses */}
          {artwork?.licenseOptions?.some(opt => opt.licenseType !== "commercial_digital") && (
          <section className="space-y-6 pb-8 border-b border-black/5">
            <div className="space-y-1">
              <label className="text-lg font-pixel uppercase tracking-widest text-black">
                Shipping &amp; Delivery
              </label>
              <p className="text-sm text-zinc-400">
                Set courier pricing by destination region. Ships from Malaysia.
              </p>
            </div>

            {/* Shipping table */}
            <div className="space-y-3">
              {/* Headers */}
              <div className="grid grid-cols-4 gap-2 items-center text-xs font-pixel uppercase tracking-widest text-zinc-400 pb-2 border-b border-zinc-100 mt-6">
                <div>Region</div>
                <div>Method</div>
                <div>Price (USDC)</div>
                <div>Estimated Days</div>
              </div>

              {/* Shipping rows */}
              {shippingFields.map((field, idx) => {
                const zoneValue = field.zone || "";
                const zoneDisplay = zoneValue
                  .replace(/_/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-4 gap-2 items-center animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
                  >
                    <div className="text-lg font-medium text-black">
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
                      {...register(`shippingRates.${idx}.price`, { valueAsNumber: true })}
                      placeholder="0.00"
                      className="mt-0"
                    />
                    <Input
                      {...register(`shippingRates.${idx}.estimatedDays`)}
                      placeholder="e.g., 5-7 days"
                      disabled
                      className="mt-0 text-zinc-400"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-zinc-400">
              Shipping integration coming soon. Prices are manually set for now.
            </p>
          </section>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-8">
            <Button type="submit" variant="default" size="main">
              Save Changes
            </Button>
            <Button type="button" variant="outline" size="main" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <Footer variant="dark" />
    </main>
  );
}
