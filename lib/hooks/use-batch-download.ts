"use client";

import { useState, useCallback } from "react";

interface UseBatchDownloadOptions {
  eventSlug: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseBatchDownloadReturn {
  isDownloading: boolean;
  progress: number;
  downloadPhotos: (options: {
    photoIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    downloadAll?: boolean;
  }) => Promise<void>;
  reset: () => void;
}

export function useBatchDownload({
  eventSlug,
  onSuccess,
  onError,
}: UseBatchDownloadOptions): UseBatchDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadPhotos = useCallback(
    async ({
      photoIds,
      dateFrom,
      dateTo,
      downloadAll = false,
    }: {
      photoIds?: string[];
      dateFrom?: string;
      dateTo?: string;
      downloadAll?: boolean;
    }) => {
      try {
        setIsDownloading(true);
        setProgress(0);

        const response = await fetch(`/api/download/${eventSlug}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photoIds,
            dateFrom,
            dateTo,
            downloadAll,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Download failed");
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "photos.zip";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/);
          if (match) {
            filename = decodeURIComponent(match[1]);
          }
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setProgress(100);
        onSuccess?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Download failed");
        onError?.(err);
        throw err;
      } finally {
        setIsDownloading(false);
      }
    },
    [eventSlug, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsDownloading(false);
    setProgress(0);
  }, []);

  return {
    isDownloading,
    progress,
    downloadPhotos,
    reset,
  };
}
