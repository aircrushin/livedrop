"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { createClient } from "@/lib/supabase/client";
import { compressImage, formatFileSize } from "@/lib/utils/image-compression";
import { uploadToR2 } from "@/lib/r2/actions";
import type { Event } from "@/lib/supabase/types";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UseCameraViewProps {
  event: Pick<Event, "id" | "slug">;
}

interface UseCameraViewReturn {
  status: UploadStatus;
  progress: number;
  error: string;
  previewUrl: string | null;
  isAuthenticated: boolean;
  flash: boolean;
  setFlash: (value: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUpload: () => Promise<void>;
  handleCancel: () => void;
  clearError: () => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useCameraView({ event }: UseCameraViewProps): UseCameraViewReturn {
  const t = useTranslations('camera');
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  // Ensure authentication
  useEffect(() => {
    async function ensureAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous auth failed:", error);
          setError(t('connectError'));
          return;
        }
      }
      setIsAuthenticated(true);
    }
    
    ensureAuth();
  }, [supabase.auth, t]);

  const validateFile = useCallback((file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith("image/") && !ALLOWED_TYPES.some(type => file.type === type)) {
      setError(t('invalidFileType'));
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge'));
      return false;
    }

    return true;
  }, [t]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    setError("");
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    e.target.value = "";
  }, [validateFile]);

  const handleUpload = useCallback(async () => {
    if (!previewUrl) return;

    setStatus("uploading");
    setProgress(0);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch the blob from preview URL
      const response = await fetch(previewUrl);
      const originalBlob = await response.blob();

      // Double-check file type
      if (!originalBlob.type.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      // Compress image
      const tempFile = new File([originalBlob], "temp.jpg", { type: originalBlob.type });
      
      setProgress(10);
      console.log(`Original size: ${formatFileSize(originalBlob.size)}`);
      
      const compressedBlob = await compressImage(tempFile, 1920, 1920, 0.85);
      
      console.log(`Compressed size: ${formatFileSize(compressedBlob.size)}`);
      const compressionRatio = ((1 - compressedBlob.size / originalBlob.size) * 100).toFixed(1);
      console.log(`Compression ratio: ${compressionRatio}%`);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${event.slug}/${user.id}-${timestamp}.jpg`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Convert blob to Uint8Array for R2 upload
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to R2
      const uploadResult = await uploadToR2(fileName, uint8Array, "image/jpeg");

      clearInterval(progressInterval);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload to R2 failed");
      }

      // Save metadata to database
      const { error: insertError } = await supabase.from("photos").insert({
        event_id: event.id,
        user_id: user.id,
        storage_path: fileName,
      });

      if (insertError) throw insertError;

      setProgress(100);
      setStatus("success");

      // Reset after success
      setTimeout(() => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setStatus("idle");
        setProgress(0);
      }, 1500);

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [previewUrl, event.id, event.slug, supabase]);

  const handleCancel = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStatus("idle");
    setError("");
  }, [previewUrl]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    status,
    progress,
    error,
    previewUrl,
    isAuthenticated,
    flash,
    setFlash,
    handleFileSelect,
    handleUpload,
    handleCancel,
    clearError,
  };
}
