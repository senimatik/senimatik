"use client";

import { useCallback, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFormContext } from "../MintFormProvider";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { CloudArrowUpIcon, TrashIcon } from "@phosphor-icons/react";
import { SupplementaryImages } from "@/components/create/SupplementaryImages";
import { convertToWebP } from "@/lib/image-processing";

export function Step1Artwork() {
  const { form } = useFormContext();
  const walletAddress = useWalletAddress();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const generateUrl = useMutation(api.r2.generateArtworkUploadUrl);
  const deleteFromR2 = useMutation(api.r2.deleteFromR2);

  const clearPreview = useCallback(() => {
    const r2PreviewKey = form.getValues("r2PreviewKey");

    // Delete from R2 if key exists
    if (r2PreviewKey && walletAddress) {
      deleteFromR2({ walletAddress, keys: [r2PreviewKey] }).catch((err) => {
        console.error("Failed to delete R2 files during clear:", err);
      });
    }

    // Clean up preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);

    // Clear form state
    form.setValue("imageFileName", "");
    form.setValue("imageType", "");
    form.setValue("imageFileSize", undefined);
    form.setValue("r2PreviewKey", undefined);
  }, [form, deleteFromR2, walletAddress]);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      clearPreview();

      setUploading(true);
      try {
        if (!walletAddress) {
          throw new Error("Wallet not connected");
        }

        // Convert to WebP before uploading
        const webpBlob = await convertToWebP(file, 0.92);

        // Show local preview from the WebP blob
        const localUrl = URL.createObjectURL(webpBlob);
        previewUrlRef.current = localUrl;
        setPreview(localUrl);

        // Get presigned URL for preview (single upload)
        const previewUploadRes = await generateUrl({
          walletAddress,
          type: "preview",
          fileName: "preview.webp",
        });

        const previewUploadResp = await fetch(previewUploadRes.url, {
          method: "PUT",
          body: webpBlob,
          headers: { "Content-Type": "image/webp" },
        });

        if (!previewUploadResp.ok) {
          throw new Error(`Upload failed: ${previewUploadResp.statusText}`);
        }

        form.setValue("r2PreviewKey", previewUploadRes.key);
        form.setValue("imageFileName", file.name);
        form.setValue("imageType", "image/webp");
        form.setValue("imageFileSize", webpBlob.size);
      } catch (err) {
        console.error("Upload failed:", err);
        clearPreview();
      } finally {
        setUploading(false);
      }
    },
    [form, clearPreview, generateUrl, walletAddress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const r2PreviewKey = useWatch({ control: form.control, name: "r2PreviewKey" });
  const imageFileName = useWatch({ control: form.control, name: "imageFileName" });
  const imageFileSize = useWatch({ control: form.control, name: "imageFileSize" });
  const isUploaded = !!r2PreviewKey;

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h3 className="text-2xl font-medium tracking-tight">
          Upload Your Artwork
        </h3>
        <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-md">
          Upload the main image for your art. Better image quality helps attract collectors.        </p>
      </div>

      <div
        {...getRootProps()}
        className={`relative aspect-video border transition-all cursor-pointer group flex flex-col items-center justify-center gap-6 overflow-hidden ${
          isDragActive
            ? "border-black bg-black/5"
            : "border-black/5 hover:border-black/20"
        }`}
      >
        <input {...getInputProps()} />

        {isUploaded && preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className={`absolute inset-0 w-full h-full object-contain transition-all ${
                uploading ? "opacity-40 blur-sm" : "opacity-100"
              }`}
            />

            {uploading && (
              <div className="absolute flex flex-col items-center gap-3 z-10">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-white">Uploading…</span>
              </div>
            )}

            {/* Delete button - top right */}
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                clearPreview();
              }}
              className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <TrashIcon size={16} weight="bold" className="text-white" />
            </button>

            {/* Image info - bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3 z-10">
              <p className="text-xs text-white truncate">
                {imageFileName}
              </p>
              <p className="text-[10px] text-white/70">
                {((imageFileSize || 0) / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <CloudArrowUpIcon
                size={32}
                weight="thin"
                className="text-zinc-400 group-hover:text-black transition-colors"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                Drag and drop primary image
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                PNG, JPG, WEBP, GIF (MAX 10MB)
              </p>
            </div>
          </>
        )}
      </div>

      <SupplementaryImages />
    </div>
  );
}
