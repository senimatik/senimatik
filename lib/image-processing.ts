/**
 * Client-side image processing utilities.
 * Pure Canvas API — no external dependencies.
 */

/**
 * Add watermark to image and resize for preview.
 * Returns a JPEG Blob.
 *
 * @param file - Input image file
 * @param maxWidth - Maximum width in pixels (default 800)
 * @param quality - JPEG quality 0-1 (default 0.85)
 */
export async function processForPreview(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions
        const aspectRatio = img.width / img.height;
        const newWidth = Math.min(img.width, maxWidth);
        const newHeight = newWidth / aspectRatio;

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Add watermark
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = `bold ${newWidth * 0.08}px Arial`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        const padding = newWidth * 0.05;
        ctx.fillText("© SENIMATIK", newWidth - padding, newHeight - padding);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert image to WebP format without resizing.
 * Used for details image in Step1.
 *
 * @param file - Input image file
 * @param quality - WebP quality 0-1 (default 0.85)
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas with original dimensions
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        // Draw image at full size
        ctx.drawImage(img, 0, 0);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Extract image dimensions from file.
 * Returns { width, height } in pixels.
 *
 * @param file - Input image file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type from file.
 * Useful for auto-detecting format string.
 *
 * @param file - Input image file
 */
export function getMimeTypeLabel(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/gif": "GIF",
  };
  return mimeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "IMAGE";
}

/**
 * Convert image to WebP with center-crop resize.
 * Used for avatar images (square output).
 *
 * @param file - Input image file
 * @param maxDimension - Maximum width/height in pixels (default 400)
 * @param quality - WebP quality 0-1 (default 0.9)
 */
export async function convertToWebPWithResize(
  file: File,
  maxDimension: number = 400,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Crop to shortest dimension (square), then resize to maxDimension
        const cropSize = Math.min(img.width, img.height);
        const outputSize = Math.min(cropSize, maxDimension);

        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        // Center crop source coordinates
        const sx = (img.width - cropSize) / 2;
        const sy = (img.height - cropSize) / 2;

        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, outputSize, outputSize);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
