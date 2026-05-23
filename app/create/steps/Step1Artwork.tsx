"use client";

import { useCallback, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useFormContext, type PendingImage } from "../MintFormProvider";
import { CloudArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { SupplementaryImages } from "@/components/create/SupplementaryImages";
import { convertToWebP } from "@/lib/image-processing";
import { toast } from "sonner";

export function Step1Artwork() {
  const { form } = useFormContext();
  const [processing, setProcessing] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const clearImage = useCallback(() => {
    const current = form.getValues("pendingPrimaryImage");
    if (current?.preview) {
      URL.revokeObjectURL(current.preview);
    }
    form.setValue("pendingPrimaryImage", undefined);
    setDropzoneKey((k) => k + 1);
  }, [form]);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      clearImage();
      setProcessing(true);

      try {
        // Convert to WebP locally (no upload yet)
        const webpBlob = await convertToWebP(file, 0.92);
        const preview = URL.createObjectURL(webpBlob);

        const pendingImage: PendingImage = {
          id: `primary_${Date.now()}`,
          blob: webpBlob,
          fileName: file.name,
          preview,
        };

        form.setValue("pendingPrimaryImage", pendingImage);
      } catch (err) {
        console.error("Processing failed:", err);
        toast.error("Failed to process image");
        clearImage();
      } finally {
        setProcessing(false);
      }
    },
    [form, clearImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDropRejected: (rejections) => {
      const firstError = rejections[0]?.errors[0];
      if (firstError) {
        if (firstError.code === "file-too-large") {
          toast.error("File too large", { description: "Maximum file size is 10MB" });
        } else if (firstError.code === "file-invalid-type") {
          toast.error("Invalid file type", { description: "Please upload PNG, JPG, or WebP" });
        } else {
          toast.error("Failed", { description: firstError.message });
        }
      }
    },
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const pendingImage = useWatch({ control: form.control, name: "pendingPrimaryImage" });
  const hasImage = !!pendingImage;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium mb-1">
          Upload Your Artwork
        </h3>
        <p className="text-muted text-base">
          Upload the main image for your art. Better image quality helps attract collectors.        </p>
      </div>

      <div
        key={dropzoneKey}
        {...getRootProps()}
        className={`relative aspect-video border transition-all cursor-pointer group flex flex-col items-center justify-center gap-6 overflow-hidden ${
          isDragActive
            ? "border-black bg-black/5"
            : "border-black/5 hover:border-black/20"
        }`}
      >
        <input {...getInputProps()} />

        {hasImage && pendingImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.preview}
              alt="Preview"
              className={`absolute inset-0 w-full h-full object-contain transition-all ${
                processing ? "opacity-40 blur-sm" : "opacity-100"
              }`}
            />

            {processing && (
              <div className="absolute flex flex-col items-center gap-3 z-10">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-base font-medium text-white">Processing…</span>
              </div>
            )}

            {/* Delete button - top right */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <TrashIcon size={16} weight="bold" className="text-white" />
            </button>

            {/* Image info - bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3 z-10">
              <p className="text-xs text-white truncate">
                {pendingImage.fileName}
              </p>
              <p className="text-[10px] text-white/70">
                {(pendingImage.blob.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <CloudArrowUpIcon
                size={32}
                weight="thin"
                className="text-muted group-hover:text-black transition-colors"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-medium">
                Drag and drop primary image
              </p>
              <p className="text-xs text-muted">
                PNG, JPG, WEBP (Max 10MB)
              </p>
            </div>
          </>
        )}
      </div>

      <SupplementaryImages />
    </div>
  );
}
