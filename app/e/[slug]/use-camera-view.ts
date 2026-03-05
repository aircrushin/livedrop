"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { createClient } from "@/lib/supabase/client";
import { compressImage, formatFileSize } from "@/lib/utils/image-compression";
import { uploadToR2 } from "@/lib/r2/actions";
import type { Event } from "@/lib/supabase/types";

type UploadStatus = "idle" | "selecting" | "uploading" | "success" | "error";

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface UseCameraViewProps {
  event: Pick<Event, "id" | "slug">;
}

interface UseCameraViewReturn {
  status: UploadStatus;
  progress: number;
  overallProgress: number;
  error: string;
  pendingFiles: PendingFile[];
  isAuthenticated: boolean;
  flash: boolean;
  setFlash: (value: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUpload: () => Promise<void>;
  handleCancel: () => void;
  handleRemoveFile: (id: string) => void;
  clearError: () => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BATCH_SIZE = 20; // Maximum number of files per batch

export function useCameraView({ event }: UseCameraViewProps): UseCameraViewReturn {
  const t = useTranslations('camera');
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
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
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check batch size limit
    if (files.length > MAX_BATCH_SIZE) {
      setError(t('tooManyFiles', { max: MAX_BATCH_SIZE }));
      e.target.value = "";
      return;
    }

    // Validate all files
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    for (const file of files) {
      if (validateFile(file)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      if (validFiles.length === 0) {
        setError(t('invalidFilesInBatch'));
        e.target.value = "";
        return;
      }
      // Show warning but continue with valid files
      console.warn(`Skipped ${invalidFiles.length} invalid files`);
    }

    setError("");
    setStatus("selecting");

    // Create pending files with preview URLs
    const newPendingFiles: PendingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));

    setPendingFiles(newPendingFiles);
    e.target.value = "";
  }, [validateFile, t]);

  const uploadSingleFile = useCallback(async (
    pendingFile: PendingFile,
    userId: string
  ): Promise<boolean> => {
    try {
      // Compress image
      const compressedBlob = await compressImage(pendingFile.file, 1920, 1920, 0.85);
      
      console.log(`Original size: ${formatFileSize(pendingFile.file.size)}`);
      console.log(`Compressed size: ${formatFileSize(compressedBlob.size)}`);
      const compressionRatio = ((1 - compressedBlob.size / pendingFile.file.size) * 100).toFixed(1);
      console.log(`Compression ratio: ${compressionRatio}%`);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 6);
      const fileName = `${event.slug}/${userId}-${timestamp}-${randomStr}.jpg`;

      // Convert blob to Uint8Array for R2 upload
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to R2
      const uploadResult = await uploadToR2(fileName, uint8Array, "image/jpeg");

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload to R2 failed");
      }

      // Save metadata to database
      const { error: insertError } = await supabase.from("photos").insert({
        event_id: event.id,
        user_id: userId,
        storage_path: fileName,
      });

      if (insertError) throw insertError;

      return true;
    } catch (err) {
      console.error("Upload failed for file:", pendingFile.file.name, err);
      return false;
    }
  }, [event.id, event.slug, supabase]);

  const handleUpload = useCallback(async () => {
    if (pendingFiles.length === 0) return;

    setStatus("uploading");
    setProgress(0);
    setOverallProgress(0);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: currentEvent } = await supabase
        .from("events")
        .select("is_active")
        .eq("id", event.id)
        .single();

      if (!currentEvent?.is_active) {
        throw new Error(t("eventEnded"));
      }

      const totalFiles = pendingFiles.length;
      let completedFiles = 0;
      let successCount = 0;
      let errorCount = 0;

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < pendingFiles.length; i++) {
        const pendingFile = pendingFiles[i];
        
        // Update status to uploading
        setPendingFiles(prev => prev.map(f => 
          f.id === pendingFile.id ? { ...f, status: "uploading" } : f
        ));

        // Update current file progress
        setProgress(Math.round(((i * 100) / totalFiles)));

        // Upload the file
        const success = await uploadSingleFile(pendingFile, user.id);

        if (success) {
          successCount++;
          setPendingFiles(prev => prev.map(f => 
            f.id === pendingFile.id ? { ...f, status: "success" } : f
          ));
        } else {
          errorCount++;
          setPendingFiles(prev => prev.map(f => 
            f.id === pendingFile.id ? { ...f, status: "error", error: t('uploadFailed') } : f
          ));
        }

        completedFiles++;
        setOverallProgress(Math.round((completedFiles / totalFiles) * 100));
      }

      setProgress(100);

      if (successCount === totalFiles) {
        setStatus("success");
        // Reset after success
        setTimeout(() => {
          pendingFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
          setPendingFiles([]);
          setStatus("idle");
          setProgress(0);
          setOverallProgress(0);
        }, 1500);
      } else if (successCount > 0) {
        // Partial success
        setStatus("success");
        setError(t('partialUpload', { success: successCount, total: totalFiles }));
        setTimeout(() => {
          pendingFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
          setPendingFiles([]);
          setStatus("idle");
          setProgress(0);
          setOverallProgress(0);
          setError("");
        }, 2000);
      } else {
        // All failed
        setStatus("error");
        setError(t('allUploadFailed'));
      }

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [pendingFiles, supabase, uploadSingleFile, t]);

  const handleCancel = useCallback(() => {
    // Revoke all object URLs
    pendingFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setPendingFiles([]);
    setStatus("idle");
    setError("");
    setProgress(0);
    setOverallProgress(0);
  }, [pendingFiles]);

  const handleRemoveFile = useCallback((id: string) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      const newFiles = prev.filter(f => f.id !== id);
      if (newFiles.length === 0) {
        setStatus("idle");
      }
      return newFiles;
    });
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    status,
    progress,
    overallProgress,
    error,
    pendingFiles,
    isAuthenticated,
    flash,
    setFlash,
    handleFileSelect,
    handleUpload,
    handleCancel,
    handleRemoveFile,
    clearError,
  };
}
