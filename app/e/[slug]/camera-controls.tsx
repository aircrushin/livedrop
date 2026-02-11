"use client";

import { X, Upload, ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface CameraControlsProps {
  previewUrl: string | null;
  status: UploadStatus;
  onCancel: () => void;
  onUpload: () => void;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}

export function CameraControls({
  previewUrl,
  status,
  onCancel,
  onUpload,
  onCameraClick,
  onGalleryClick,
}: CameraControlsProps) {
  const t = useTranslations('camera');
  const tCommon = useTranslations('common');

  const isIdle = status === "idle";

  if (previewUrl && isIdle) {
    return (
      <>
        <Button
          variant="ghost"
          size="lg"
          onClick={onCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6 mr-2" />
          {tCommon('cancel')}
        </Button>
        <Button
          size="lg"
          onClick={onUpload}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Upload className="h-6 w-6 mr-2" />
          {t('upload')}
        </Button>
      </>
    );
  }

  return (
    <>
      <button
        onClick={onGalleryClick}
        disabled={!isIdle}
        className="h-14 w-14 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <ImagePlus className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={onCameraClick}
        disabled={!isIdle}
        className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <div className="h-14 w-14 rounded-full bg-white" />
      </button>

      <div className="w-14" />
    </>
  );
}
