"use client";

import { X, Upload, ImagePlus, Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface CameraControlsProps {
  hasPendingFiles: boolean;
  isSelecting: boolean;
  isUploading: boolean;
  isSuccess: boolean;
  fileCount: number;
  onCancel: () => void;
  onUpload: () => void;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}

export function CameraControls({
  hasPendingFiles,
  isSelecting,
  isUploading,
  isSuccess,
  fileCount,
  onCancel,
  onUpload,
  onCameraClick,
  onGalleryClick,
}: CameraControlsProps) {
  const t = useTranslations('camera');
  const tCommon = useTranslations('common');

  const isIdle = !hasPendingFiles && !isUploading && !isSuccess;
  const showActions = isSelecting && hasPendingFiles;

  if (showActions) {
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
          {fileCount > 1 ? t('uploadBatch', { count: fileCount }) : t('upload')}
        </Button>
      </>
    );
  }

  if (isUploading) {
    return (
      <div className="text-white/60 text-sm">
        {t('uploading')}
      </div>
    );
  }

  if (isSuccess) {
    return null; // Success state is handled in PreviewArea
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

      <button
        onClick={onGalleryClick}
        disabled={!isIdle}
        className="h-14 w-14 rounded-full border-2 border-white/60 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 md:hidden"
      >
        <Camera className="h-6 w-6 text-white" />
      </button>

      <div className="w-14 hidden md:block" />
    </>
  );
}
