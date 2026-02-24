"use client";

import { useCallback, useState } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import type { PhotoType } from "../../lib/types/forms";
import { PHOTO_LABELS } from "../../lib/types/forms";

interface PhotoUploadProps {
  photoType: PhotoType;
  value: File | string | null;
  onChange?: (file: File | null) => void;
  readOnly?: boolean;
}

export function PhotoUpload({
  photoType,
  value,
  onChange,
  readOnly = false,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        onChange?.(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange?.(file);
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

  const label = PHOTO_LABELS[photoType];

  // Read-only display with image
  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-gray-800 bg-gray-800/50">
          {typeof value === "string" && value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-600">
              <User className="h-10 w-10" />
              <span className="mt-2 text-xs">Sin foto</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          Obligatorio
        </span>
      </div>
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
            <button
              type="button"
              onClick={() => handleFile(null)}
              className="absolute right-2 top-2 rounded-full bg-gray-900/80 p-1.5 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-400 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
              {isDragging ? (
                <Upload className="h-5 w-5 text-red-400" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </div>
            <span className="text-xs text-center px-4">
              {isDragging ? "Suelta la imagen" : "Arrastra o pulsa para subir"}
            </span>
            <span className="text-[10px] text-gray-600">
              {photoType === "front" ? "Vista frontal" : "Vista lateral"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
