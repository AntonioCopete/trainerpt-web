"use client";

import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera, Upload, X, User, Loader2, ZoomIn } from "lucide-react";
import type { PhotoType } from "../../lib/types/forms";
import { PHOTO_LABELS } from "../../lib/types/forms";

/** Opciones de compresión: buena calidad para fotos de progreso (fitness). */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 2.5,
  maxWidthOrHeight: 1920,
  initialQuality: 0.92,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS);
}

interface PhotoUploadProps {
  photoType: PhotoType;
  value: File | string | null;
  onChange?: (file: File | null) => void;
  readOnly?: boolean;
  /** When false, hides internal label/header to avoid duplicating labels in the parent */
  showLabel?: boolean;
  /** Override for `alt`/aria text when the parent already provides the label */
  labelText?: string;
  /** En modo readOnly: thumbnail más compacto para listados/respuestas */
  compact?: boolean;
}

export function PhotoUpload({
  photoType,
  value,
  onChange,
  readOnly = false,
  showLabel = true,
  labelText,
  compact = false,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setPreview(null);
        onChange?.(null);
        return;
      }
      if (!file.type.startsWith("image/")) return;
      setIsProcessing(true);
      try {
        const optimized = await compressImage(file);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(optimized);
        previewUrlRef.current = url;
        setPreview(url);
        onChange?.(optimized);
      } catch {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setPreview(url);
        onChange?.(file);
      } finally {
        setIsProcessing(false);
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const label = labelText ?? PHOTO_LABELS[photoType] ?? "Foto";

  // Read-only display with image (marco vertical tipo móvil; object-contain evita recortes)
  if (readOnly) {
    const hasImage = typeof value === "string" && value;
    return (
      <div>
        <button
          type="button"
          onClick={() => hasImage && setLightboxOpen(true)}
          className={`relative block w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950 text-left transition-opacity ${
            compact
              ? "aspect-[3/4] max-h-52 sm:max-h-60"
              : "aspect-[3/4] max-h-[min(70vh,28rem)]"
          } ${hasImage ? "cursor-zoom-in hover:opacity-90" : "cursor-default"}`}
        >
          {hasImage ? (
            <>
              <img
                src={value}
                alt={label}
                className="h-full w-full object-contain object-center"
              />
              <div
                className={`absolute rounded-full bg-black/60 text-white ${compact ? "bottom-1 right-1 p-1" : "bottom-2 right-2 p-1.5"}`}
              >
                <ZoomIn className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-600">
              <User className="h-10 w-10" />
              <span className="mt-2 text-xs">Sin foto</span>
            </div>
          )}
        </button>
        {hasImage && lightboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Ver ${label} en tamaño completo`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={value}
              alt={label}
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            Obligatorio
          </span>
        </div>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-red-500 bg-red-500/5"
            : preview
              ? "border-gray-700 bg-gray-800/50"
              : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover"
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => handleFile(null)}
              disabled={isProcessing}
              className="absolute right-2 top-2 rounded-full bg-gray-900/80 p-1.5 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-400 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-red-400" />
              ) : isDragging ? (
                <Upload className="h-5 w-5 text-red-400" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </div>
            <span className="text-xs text-center px-4">
              {isProcessing
                ? "Optimizando imagen..."
                : isDragging
                  ? "Suelta la imagen"
                  : "Arrastra o pulsa para subir"}
            </span>
            {showLabel && (
              <span className="text-[10px] text-gray-600">Foto</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isProcessing}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
