"use client";

import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { useCameraView } from "./use-camera-view";
import { CameraHeader } from "./camera-header";
import { PreviewArea } from "./preview-area";
import { CameraControls } from "./camera-controls";
import type { Event } from "@/lib/supabase/types";

interface CameraViewProps {
  event: Pick<Event, "id" | "name" | "slug">;
}

export function CameraView({ event }: CameraViewProps) {
  const {
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
  } = useCameraView({ event });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <CameraHeader
        eventName={event.name}
        eventSlug={event.slug}
        flash={flash}
        onToggleFlash={() => setFlash(!flash)}
      />

      <div className="flex-1 flex items-center justify-center relative">
        <PreviewArea
          previewUrl={previewUrl}
          status={status}
          progress={progress}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="absolute top-20 left-4 right-4 p-3 bg-destructive/90 text-destructive-foreground rounded-lg text-sm text-center cursor-pointer"
          onClick={clearError}
        >
          {error}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="p-6 pb-8 bg-black/50 backdrop-blur flex items-center justify-center gap-6">
        <CameraControls
          previewUrl={previewUrl}
          status={status}
          onCancel={handleCancel}
          onUpload={handleUpload}
          onCameraClick={triggerCamera}
          onGalleryClick={triggerGallery}
        />
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

      <PWAInstallPrompt />
    </div>
  );
}
