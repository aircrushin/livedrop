"use client";
/* eslint-disable @next/next/no-img-element */

import { Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface PendingFile {
  id: string;
  previewUrl: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

type UploadStatus = "idle" | "selecting" | "uploading" | "success" | "error";

interface PreviewAreaProps {
  pendingFiles: PendingFile[];
  status: UploadStatus;
  progress: number;
  overallProgress: number;
  onRemoveFile: (id: string) => void;
}

export function PreviewArea({ 
  pendingFiles, 
  status, 
  progress, 
  overallProgress,
  onRemoveFile 
}: PreviewAreaProps) {
  const t = useTranslations('camera');

  if (pendingFiles.length === 0) {
    return (
      <div className="mx-auto max-w-sm px-8 text-center text-white">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
          <svg className="h-10 w-10 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-xl font-semibold">{t('emptyTitle')}</p>
        <p className="mt-2 text-sm leading-6 text-white/60">{t('emptySubtitle')}</p>
      </div>
    );
  }

  const isUploading = status === "uploading";
  const isSuccess = status === "success";
  const canRemove = status === "selecting" || status === "idle";

  // Single image view
  if (pendingFiles.length === 1) {
    const file = pendingFiles[0];
    return (
      <div className="relative max-h-full max-w-full md:max-h-[60vh] md:max-w-[50vw]">
        <img
          src={file.previewUrl}
          alt="Preview"
          className="max-h-full max-w-full object-contain rounded-lg"
        />
        
        {/* Remove button */}
        {canRemove && (
          <button
            onClick={() => onRemoveFile(file.id)}
            className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
            <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-medium text-white">{t('uploading')}</p>
            <p className="mt-1 text-xs text-white/60">{t('uploadingHint')}</p>
          </div>
        )}
        
        {isSuccess && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <Check className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-white">{t('uploadSuccessTitle')}</p>
            <p className="mt-1 text-sm text-white/70">{t('uploadSuccessSubtitle')}</p>
          </div>
        )}

        {file.status === "error" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <div className="h-16 w-16 rounded-full bg-destructive flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-white" />
            </div>
            <p className="text-white font-medium">{file.error || t('uploadError')}</p>
          </div>
        )}
      </div>
    );
  }

  // Multiple images grid view
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      {/* Overall progress for batch upload */}
      {isUploading && (
        <div className="w-full max-w-md mb-4">
          <div className="flex justify-between text-white/60 text-sm mb-2">
            <span>{t('uploadingCount', { current: Math.round((overallProgress / 100) * pendingFiles.length), total: pendingFiles.length })}</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-white/60">{t('uploadingHint')}</p>
        </div>
      )}

      {/* Success overlay */}
      {isSuccess && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-white">{t('uploadSuccessTitle')}</p>
          <p className="mt-1 text-sm text-white/70">{t('uploadSuccessSubtitle')}</p>
        </div>
      )}

      {/* Image grid */}
      <div className={`grid gap-2 ${
        pendingFiles.length <= 2 ? 'grid-cols-2' :
        pendingFiles.length <= 4 ? 'grid-cols-2' :
        pendingFiles.length <= 6 ? 'grid-cols-3' :
        pendingFiles.length <= 9 ? 'grid-cols-3' :
        'grid-cols-4'
      } max-w-4xl max-h-[60vh] overflow-auto`}>
        {pendingFiles.map((file) => (
          <div 
            key={file.id} 
            className="relative aspect-square w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg overflow-hidden bg-gray-800"
          >
            <img
              src={file.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            
            {/* Remove button */}
            {canRemove && (
              <button
                onClick={() => onRemoveFile(file.id)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Status indicators */}
            {file.status === "uploading" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}

            {file.status === "success" && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}

            {file.status === "error" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-destructive flex items-center justify-center">
                  <X className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* File count indicator */}
      <div className="mt-4 text-white/60 text-sm">
        {t('selectedCount', { count: pendingFiles.length })}
      </div>
    </div>
  );
}
