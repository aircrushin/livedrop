"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Zap, ZapOff, Check, Loader2, X, Upload, ImagePlus, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import type { Event } from "@/lib/supabase/types";

interface CameraViewProps {
  event: Pick<Event, "id" | "name" | "slug">;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function CameraView({ event }: CameraViewProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function ensureAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Sign in anonymously for frictionless experience
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous auth failed:", error);
          setError("Could not connect. Please refresh the page.");
          return;
        }
      }
      setIsAuthenticated(true);
    }
    
    ensureAuth();
  }, [supabase.auth]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - must be an image
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
    if (!file.type.startsWith("image/") && !allowedTypes.some(type => file.type === type)) {
      setError("Please select an image file (JPEG, PNG, GIF, WebP, or HEIC)");
      e.target.value = "";
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("Image is too large. Maximum size is 10MB.");
      e.target.value = "";
      return;
    }

    // Clear any previous errors
    setError("");

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Reset input for next photo
    e.target.value = "";
  }

  async function handleUpload() {
    if (!previewUrl) return;

    setStatus("uploading");
    setProgress(0);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch the blob from preview URL
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      // Double-check file type before upload
      if (!blob.type.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = blob.type.split("/")[1] || "jpg";
      const fileName = `${event.slug}/${user.id}-${timestamp}.${extension}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("event-photos")
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

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
        setPreviewUrl(null);
        setStatus("idle");
        setProgress(0);
      }, 1500);

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }

  function handleCancel() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStatus("idle");
    setError("");
  }

  function triggerCamera() {
    fileInputRef.current?.click();
  }

  function triggerGallery() {
    galleryInputRef.current?.click();
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
        <div className="text-white">
          <p className="text-xs text-white/60 uppercase tracking-wide">LiveDrop</p>
          <p className="font-medium">{event.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white hover:bg-white/10"
          >
            <Link href={`/live/${event.slug}`}>
              <MonitorPlay className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlash(!flash)}
            className="text-white hover:bg-white/10"
          >
            {flash ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Preview/Camera Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {status === "uploading" && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm mt-2">Uploading...</p>
              </div>
            )}
            {status === "success" && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <p className="text-white font-medium">Photo uploaded!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white/40 p-8">
            <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Take a photo or choose from gallery</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 p-3 bg-destructive/90 text-destructive-foreground rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="p-6 pb-8 bg-black/50 backdrop-blur flex items-center justify-center gap-6">
        {previewUrl && status === "idle" ? (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleCancel}
              className="text-white hover:bg-white/10"
            >
              <X className="h-6 w-6 mr-2" />
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleUpload}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Upload className="h-6 w-6 mr-2" />
              Upload
            </Button>
          </>
        ) : (
          <>
            {/* Gallery button */}
            <button
              onClick={triggerGallery}
              disabled={status !== "idle"}
              className="h-14 w-14 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <ImagePlus className="h-6 w-6 text-white" />
            </button>

            {/* Camera button */}
            <button
              onClick={triggerCamera}
              disabled={status !== "idle"}
              className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <div className="h-14 w-14 rounded-full bg-white" />
            </button>

            {/* Spacer to center camera button */}
            <div className="w-14" />
          </>
        )}
      </div>

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Hidden file input for gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
