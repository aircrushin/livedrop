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
  onUploadAnother: () => void;
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
  onUploadAnother,
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
          {fileCount > 1 ? t('uploadBatchAction', { count: fileCount }) : t('uploadSingleAction')}
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
    return (
      <Button
        size="lg"
        onClick={onUploadAnother}
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        <Camera className="h-5 w-5 mr-2" />
        {t('uploadAnother')}
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <button
        type="button"
        onClick={onCameraClick}
        disabled={!isIdle}
        aria-label={t('cameraAction')}
        className="flex flex-col items-center gap-3 disabled:opacity-50"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/10">
          <span className="h-14 w-14 rounded-full bg-white" />
        </span>
        <span className="text-sm font-medium text-white">{t('cameraAction')}</span>
      </button>

      <button
        onClick={onGalleryClick}
        type="button"
        disabled={!isIdle}
        aria-label={t('galleryAction')}
        className="flex flex-col items-center gap-3 disabled:opacity-50"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/60 bg-white/10">
          <ImagePlus className="h-7 w-7 text-white" />
        </span>
        <span className="text-sm font-medium text-white">{t('galleryAction')}</span>
      </button>
    </div>
  );
}
