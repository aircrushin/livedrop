"use client";

import { CheckSquare, Clock, Loader2, Square, TrendingUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PhotoWithLikes } from "./page";
import type { SortMode, ViewMode } from "./use-live-gallery";

interface GalleryHeaderProps {
  eventName: string;
  photos: PhotoWithLikes[];
  isConnected: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  isSelectMode: boolean;
  setIsSelectMode: (value: boolean) => void;
  selectedPhotos: Set<string>;
  isDownloading: boolean;
  onBatchDownload: () => void;
  selectAll: () => void;
  deselectAll: () => void;
}

export function GalleryHeader({
  eventName,
  photos,
  isConnected,
  sortMode,
  setSortMode,
  isSelectMode,
  setIsSelectMode,
  selectedPhotos,
  isDownloading,
  onBatchDownload,
  selectAll,
  deselectAll,
}: GalleryHeaderProps) {
  const t = useTranslations('live');

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      deselectAll();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Event Info */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <svg className="h-5 w-5 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide">LiveDrop</p>
            <p className="font-bold text-lg">{eventName}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Batch Selection Toggle */}
          {photos.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelectMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {isSelectMode ? (
                <>
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('cancelSelection')}</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('selectPhotos')}</span>
                </>
              )}
            </button>
          )}

          {/* Sort Mode Toggle */}
          {!isSelectMode && (
            <div className="flex items-center bg-white/10 rounded-full p-1">
              <button
                onClick={() => setSortMode("newest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortMode === "newest"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/60 hover:text-white/80"
                }`}
                title={t('newest')}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{t('newest')}</span>
              </button>
              <button
                onClick={() => setSortMode("popular")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortMode === "popular"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/60 hover:text-white/80"
                }`}
                title={t('popular')}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t('popular')}</span>
              </button>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-white/60">
              {isConnected ? t('live') : t('connecting')}
            </span>
          </div>
        </div>
      </div>

      {/* Selection Toolbar */}
      {isSelectMode && (
        <div className="max-w-screen-2xl mx-auto mt-3 flex items-center justify-between bg-white/10 backdrop-blur rounded-lg px-4 py-2 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">
              {t('selectedCount', { count: selectedPhotos.size, total: photos.length })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                {t('selectAll')}
              </button>
              <span className="text-white/30">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                {t('deselectAll')}
              </button>
            </div>
          </div>
          <button
            onClick={onBatchDownload}
            disabled={selectedPhotos.size === 0 || isDownloading}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isDownloading ? t('packaging') : t('downloadSelected')}
          </button>
        </div>
      )}
    </div>
  );
}
