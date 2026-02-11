"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Calendar, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBatchDownload } from "@/lib/hooks/use-batch-download";

interface BatchDownloadDialogProps {
  eventSlug: string;
  photoCount: number;
  eventCreatedAt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchDownloadDialog({
  eventSlug,
  photoCount,
  eventCreatedAt,
  isOpen,
  onClose,
}: BatchDownloadDialogProps) {
  const t = useTranslations("event");
  const [dateFrom, setDateFrom] = useState(() => eventCreatedAt.split("T")[0]);
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const { isDownloading, downloadPhotos } = useBatchDownload({
    eventSlug,
    onSuccess: () => {
      setDownloadComplete(true);
      setTimeout(() => {
        setDownloadComplete(false);
        onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Download error:", error);
      alert(t("downloadError"));
    },
  });

  const handleDownload = async () => {
    try {
      await downloadPhotos({
        downloadAll: true,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    } catch {
      // Error handled in onError callback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md mx-4 rounded-xl shadow-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t("batchDownload")}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            disabled={isDownloading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Photo count */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t("totalPhotos", { count: photoCount })}</p>
              <p className="text-sm text-muted-foreground">{t("willBeDownloaded")}</p>
            </div>
          </div>

          {/* Date filters */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {t("filterByDate")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  {t("dateFrom")}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isDownloading}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  {t("dateTo")}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isDownloading}
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom(eventCreatedAt.split("T")[0]);
                  setDateTo(new Date().toISOString().split("T")[0]);
                }}
                className="text-xs text-primary hover:underline"
                disabled={isDownloading}
              >
                {t("clearFilters")}
              </button>
            )}
          </div>

          {/* Progress */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("packagingPhotos")}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* Success */}
          {downloadComplete && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <Check className="h-4 w-4" />
              {t("downloadComplete")}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isDownloading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isDownloading || photoCount === 0}
              className="flex-1"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("downloading")}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t("downloadZip")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
