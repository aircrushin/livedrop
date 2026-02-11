"use client";

import { Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface PreviewAreaProps {
  previewUrl: string | null;
  status: UploadStatus;
  progress: number;
}

export function PreviewArea({ previewUrl, status, progress }: PreviewAreaProps) {
  const t = useTranslations('camera');

  if (!previewUrl) {
    return (
      <div className="text-center text-white/40 p-8">
        <svg className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg">{t('prompt')}</p>
      </div>
    );
  }

  return (
    <div className="relative max-h-full max-w-full md:max-h-[60vh] md:max-w-[50vw]">
      <img
        src={previewUrl}
        alt="Preview"
        className="max-h-full max-w-full object-contain rounded-lg"
      />
      
      {status === "uploading" && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
          <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/60 text-sm mt-2">{t('uploading')}</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
          <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-white font-medium">{t('uploadSuccess')}</p>
        </div>
      )}
    </div>
  );
}
