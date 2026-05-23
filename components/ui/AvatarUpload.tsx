"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { convertToWebPWithResize } from "@/lib/image-processing";
import { CameraIcon, CheckIcon, XIcon, TrashIcon } from "@phosphor-icons/react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUploadComplete: (avatarKey: string) => void;
  onClear?: () => void;
  onUploadError?: (error: string) => void;
  size?: "sm" | "md" | "lg";
}

type State = "idle" | "preview" | "uploading";

export function AvatarUpload({
  currentAvatar,
  onUploadComplete,
  onClear,
  onUploadError,
  size = "md",
}: AvatarUploadProps) {
  const [state, setState] = useState<State>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);
  const generateUrl = useMutation(api.r2.generateProfileImageUploadUrl);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Convert and show preview (don't upload yet)
    convertToWebPWithResize(file, 400, 0.9)
      .then((blob) => {
        pendingBlobRef.current = blob;
        const localUrl = URL.createObjectURL(blob);
        setPreviewUrl(localUrl);
        setState("preview");
      })
      .catch((err) => {
        onUploadError?.(err instanceof Error ? err.message : "Failed to process image");
      });
  }, [onUploadError]);

  const handleConfirm = useCallback(async () => {
    if (!pendingBlobRef.current) return;

    setState("uploading");
    try {
      const { url, key } = await generateUrl({});

      const resp = await fetch(url, {
        method: "PUT",
        body: pendingBlobRef.current,
        headers: { "Content-Type": "image/webp" },
      });

      if (!resp.ok) throw new Error(`Upload failed: ${resp.statusText}`);

      onUploadComplete(key);
      setState("idle");
      // Clean up preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      pendingBlobRef.current = null;
    } catch (err) {
      console.error("Avatar upload failed:", err);
      onUploadError?.(err instanceof Error ? err.message : "Upload failed");
      setState("preview"); // Stay in preview so user can retry
    }
  }, [generateUrl, onUploadComplete, onUploadError, previewUrl]);

  const handleCancel = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    pendingBlobRef.current = null;
    setState("idle");
  }, [previewUrl]);

  const handleDelete = useCallback(() => {
    onClear?.();
  }, [onClear]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    noClick: state !== "idle",
    noDrag: state !== "idle",
  });

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  // Determine what image to show
  const displayUrl = state === "preview" && previewUrl
    ? previewUrl
    : currentAvatar
      ? (currentAvatar.startsWith("http") ? currentAvatar : `${R2_PUBLIC_URL}/${currentAvatar}`)
      : null;

  const hasExistingAvatar = !!currentAvatar;

  return (
    <div className="flex items-end gap-4">
      <div
        {...getRootProps()}
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer group border border-black/10`}
      >
        <input {...getInputProps()} />

        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Avatar"
            fill
            className="object-cover"
            sizes="160px"
            priority
          />
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
            <CameraIcon size={24} className="text-zinc-400" />
          </div>
        )}

        {/* Hover overlay - only when idle */}
        {state === "idle" && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <CameraIcon size={24} className="text-white" />
          </div>
        )}

        {/* Uploading spinner */}
        {state === "uploading" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {state === "preview" && (
          <>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-base font-medium hover:bg-zinc-800 transition-colors"
            >
              <CheckIcon size={14} weight="bold" />
              Confirm
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 text-base font-medium hover:bg-zinc-50 transition-colors"
            >
              <XIcon size={14} />
              Cancel
            </button>
          </>
        )}

        {state === "idle" && hasExistingAvatar && onClear && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-base text-muted hover:text-red-500 transition-colors cursor-pointer"
          >
            <TrashIcon size={14} />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
