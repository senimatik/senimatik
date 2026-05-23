"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useFormContext, type PendingImage } from "@/app/create/MintFormProvider";
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

// Sortable image item component
function SortableImageItem({ image, onDelete }: { image: PendingImage; onDelete: (id: string) => void }) {
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
      <img src={image.preview} alt={image.fileName} className="w-full h-full object-cover" />

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
        <p className="text-[9px] text-white truncate">{image.fileName}</p>
        <p className="text-[8px] text-white/70">{(image.blob.size / 1024 / 1024).toFixed(1)}MB</p>
      </div>
    </div>
  );
}

export function SupplementaryImages() {
  const { form } = useFormContext();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingImages = useWatch({
    control: form.control,
    name: "pendingSupplementaryImages",
    defaultValue: []
  });

  const totalSize = pendingImages.reduce((sum, img) => sum + img.blob.size, 0);
  const remainingSize = MAX_TOTAL_SIZE - totalSize;
  const canAddMore = pendingImages.length < MAX_IMAGES && remainingSize > 0;

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
      setProcessing(true);

      try {
        let runningTotal = totalSize;

        for (const file of files) {
          // Convert to WebP locally (no upload yet)
          const webpBlob = await convertToWebP(file);

          // Check total size
          if (runningTotal + webpBlob.size > MAX_TOTAL_SIZE) {
            const remaining = (MAX_TOTAL_SIZE - runningTotal) / 1024 / 1024;
            setError(`Cannot add image. Total size would exceed 10MB. ${remaining.toFixed(1)}MB remaining.`);
            break;
          }

          // Create preview
          const preview = URL.createObjectURL(webpBlob);
          previewUrlsRef.current.add(preview);

          runningTotal += webpBlob.size;

          const newImage: PendingImage = {
            id: `img_${Date.now()}_${Math.random()}`,
            blob: webpBlob,
            fileName: file.name,
            preview,
          };

          const current = form.getValues("pendingSupplementaryImages") || [];
          form.setValue("pendingSupplementaryImages", [...current, newImage]);
        }
      } catch (err) {
        setError("Failed to process images. Please try again.");
        console.error(err);
      } finally {
        setProcessing(false);
      }
    },
    [form, totalSize]
  );

  const handleDeleteImage = useCallback(
    (id: string) => {
      const current = form.getValues("pendingSupplementaryImages") || [];
      const image = current.find((img) => img.id === id);

      if (image) {
        URL.revokeObjectURL(image.preview);
        form.setValue(
          "pendingSupplementaryImages",
          current.filter((img) => img.id !== id)
        );
      }
    },
    [form]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const current = form.getValues("pendingSupplementaryImages") || [];
        const oldIndex = current.findIndex((img) => img.id === active.id);
        const newIndex = current.findIndex((img) => img.id === over.id);
        form.setValue("pendingSupplementaryImages", arrayMove(current, oldIndex, newIndex));
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
    maxFiles: MAX_IMAGES - pendingImages.length,
    maxSize: remainingSize,
    disabled: !canAddMore || processing,
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
        <label className="text-base font-pixel uppercase tracking-widest text-black mb-1">
          Supplementary Images
        </label>
        <p className="text-sm text-muted">
          Add up to {MAX_IMAGES} additional images. Max {MAX_TOTAL_SIZE / 1024 / 1024}MB total.
        </p>
      </div>

      {/* Images grid with drag-drop */}
      {pendingImages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pendingImages.map((img) => img.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pendingImages.map((image) => (
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
            processing ? "border-blue-500/40 bg-blue-500/5" : "border-black/10 hover:border-black/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1 text-center">
            <CloudArrowUpIcon
              size={28}
              weight="thin"
              className="text-muted"
            />
            <p className="text-base font-medium text-black">
              {processing ? "Processing…" : `Add images (${pendingImages.length}/${MAX_IMAGES})`}
            </p>
            <p className="text-xs text-muted">
              {(remainingSize / 1024 / 1024).toFixed(1)}MB remaining
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-base text-red-500">{error}</p>}
    </div>
  );
}
