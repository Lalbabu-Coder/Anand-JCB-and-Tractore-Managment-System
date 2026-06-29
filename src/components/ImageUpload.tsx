"use client";

import React, { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadEntityImage } from "@/app/actions/upload";

interface ImageUploadProps {
  entityType: "USER" | "CUSTOMER" | "MACHINE";
  entityId?: string;
  currentImage?: string | null;
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export function ImageUpload({ entityType, entityId, currentImage, onUploadSuccess, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create a local preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setPreviewUrl(base64String);

      if (entityId) {
        // Upload to server
        const res = await uploadEntityImage(entityType, entityId, base64String);
        if (res.success && res.imageUrl) {
          setPreviewUrl(res.imageUrl);
          if (onUploadSuccess) onUploadSuccess(res.imageUrl);
        } else {
          setError(res.error || "Upload failed");
          setPreviewUrl(currentImage || null); // revert
        }
      } else {
        // Just return base64 up to parent to handle
        if (onUploadSuccess) onUploadSuccess(base64String);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-zinc-700 bg-zinc-900 transition-all hover:border-violet-500 hover:bg-zinc-800"
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-500 group-hover:text-violet-400">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {!isUploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Upload className="h-6 w-6 text-white" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
