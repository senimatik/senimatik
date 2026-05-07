"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFormContext } from "@/app/create/MintFormProvider";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { CloudArrowUpIcon, TrashIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
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
import { convertToWebP } from "@/lib/image-processing";

const MAX_IMAGES = 5;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

interface SupplementaryImage {
  id: string;
  file: string;
  type: string;
  size: number;
  r2Key: string;
  preview: string;
}

// Sortable image item component
function SortableImageItem({ image, onDelete }: { image: SupplementaryImage; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group aspect-square bg-zinc-100 overflow-hidden border border-black/5 hover:border-black/20 transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.preview} alt={image.file} className="w-full h-full object-cover" />

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
        onClick={() => onDelete(image.id)}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TrashIcon size={14} weight="bold" className="text-white" />
      </button>

      {/* Image info */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
        <p className="text-[9px] text-white truncate">{image.file}</p>
        <p className="text-[8px] text-white/70">{(image.size / 1024 / 1024).toFixed(1)}MB</p>
      </div>
    </div>
  );
}

export function SupplementaryImages() {
  const { form } = useFormContext();
  const walletAddress = useWalletAddress();
  const generateUrl = useMutation(api.r2.generateArtworkUploadUrl);
  const deleteFromR2 = useMutation(api.r2.deleteFromR2);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supplementaryImages = useWatch({ control: form.control, name: "supplementaryImages", defaultValue: [] });

  const totalSize = supplementaryImages.reduce((sum, img) => sum + img.size, 0);
  const remainingSize = MAX_TOTAL_SIZE - totalSize;
  const canAddMore = supplementaryImages.length < MAX_IMAGES && remainingSize > 0;

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

  const handleAddImages = useCallback(
    async (files: File[]) => {
      setError(null);
      setUploading(true);

      try {
        if (!walletAddress) {
          setError("Wallet not connected");
          return;
        }

        let runningTotal = totalSize;

        for (const file of files) {
          // Convert to WebP first so we know the actual upload size
          const webpBlob = await convertToWebP(file);

          // Check total size using running total (accounts for earlier files in this batch)
          if (runningTotal + webpBlob.size > MAX_TOTAL_SIZE) {
            const remaining = (MAX_TOTAL_SIZE - runningTotal) / 1024 / 1024;
            setError(`Cannot add image. Total size would exceed 10MB. ${remaining.toFixed(1)}MB remaining.`);
            break;
          }

          const webpFileName = `supp_${Date.now()}_${file.name.replace(/\.[^.]+$/, "")}.webp`;

          // Generate upload URL
          const uploadRes = await generateUrl({
            walletAddress,
            type: "details",
            fileName: webpFileName,
          });

          // Upload to R2
          const uploadResp = await fetch(uploadRes.url, {
            method: "PUT",
            body: webpBlob,
            headers: { "Content-Type": "image/webp" },
          });

          if (!uploadResp.ok) {
            throw new Error(`Upload failed: ${uploadResp.statusText}`);
          }

          // Create preview and track for cleanup
          const preview = URL.createObjectURL(webpBlob);
          previewUrlsRef.current.add(preview);

          // Track actual uploaded size
          runningTotal += webpBlob.size;

          // Add to form — use WebP metadata to match the uploaded asset
          const newImage: SupplementaryImage = {
            id: `img_${Date.now()}_${Math.random()}`,
            file: file.name,
            type: "image/webp",
            size: webpBlob.size,
            r2Key: uploadRes.key,
            preview,
          };

          const current = form.getValues("supplementaryImages") || [];
          form.setValue("supplementaryImages", [...current, newImage]);
        }
      } catch (err) {
        setError("Upload failed. Please try again.");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [form, generateUrl, totalSize, walletAddress]
  );

  const handleDeleteImage = useCallback(
    async (id: string) => {
      if (!walletAddress) {
        console.error("Wallet not connected");
        return;
      }

      const current = form.getValues("supplementaryImages") || [];
      const image = current.find((img) => img.id === id);

      if (image) {
        try {
          // Clean up preview URL
          URL.revokeObjectURL(image.preview);
          // Delete from R2
          await deleteFromR2({ walletAddress, keys: [image.r2Key] });
          // Remove from form
          form.setValue(
            "supplementaryImages",
            current.filter((img) => img.id !== id)
          );
        } catch (err) {
          console.error("Failed to delete image:", err);
        }
      }
    },
    [form, deleteFromR2, walletAddress]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const current = form.getValues("supplementaryImages") || [];
        const oldIndex = current.findIndex((img) => img.id === active.id);
        const newIndex = current.findIndex((img) => img.id === over.id);
        form.setValue("supplementaryImages", arrayMove(current, oldIndex, newIndex));
      }
    },
    [form]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleAddImages,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: MAX_IMAGES - supplementaryImages.length,
    maxSize: remainingSize,
    disabled: !canAddMore || uploading,
  });

  // Track created object URLs for cleanup on unmount
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-pixel uppercase tracking-widest text-black">
          Supplementary Images
        </label>
        <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
          Add up to {MAX_IMAGES} additional images. Max {MAX_TOTAL_SIZE / 1024 / 1024}MB total. Auto-converted to WebP.
        </p>
      </div>

      {/* Images grid with drag-drop */}
      {supplementaryImages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={supplementaryImages.map((img) => img.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {supplementaryImages.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onDelete={handleDeleteImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`h-30 w-full relative aspect-square border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 p-4 ${
            uploading ? "border-blue-500/40 bg-blue-500/5" : "border-black/10 hover:border-black/30"
          }`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon
            size={28}
            weight="thin"
            className="text-zinc-400"
          />
          <div className="text-center">
            <p className="text-xs font-medium text-black">
              {uploading ? "Uploading…" : `Add images (${supplementaryImages.length}/${MAX_IMAGES})`}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              {(remainingSize / 1024 / 1024).toFixed(1)}MB remaining
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
