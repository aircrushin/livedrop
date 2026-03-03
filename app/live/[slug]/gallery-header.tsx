"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveDropLogo } from "@/components/livedrop-logo";
import { CheckSquare, Clock, GalleryHorizontal, Loader2, Menu, TrendingUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import type { PhotoWithLikes } from "./page";
import type { SortMode } from "./use-live-gallery";
import type { ViewMode } from "./live-gallery";

interface GalleryHeaderProps {
  eventName: string;
  photos: PhotoWithLikes[];
  isConnected: boolean;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
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
  viewMode,
  setViewMode,
  isSelectMode,
  setIsSelectMode,
  selectedPhotos,
  isDownloading,
  onBatchDownload,
  selectAll,
  deselectAll,
}: GalleryHeaderProps) {
  const t = useTranslations('live');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      deselectAll();
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background/80 to-transparent">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Event Info */}
        <div className="flex items-center gap-3">
          <LiveDropLogo subtitle={eventName} priority />
          {/* Photo Count Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{photos.length} {t('photos')}</span>
          </div>
        </div>

        {/* Controls - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          {/* Batch Selection Toggle */}
          {photos.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelectMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {isSelectMode ? (
                <>
                  <X className="h-4 w-4" />
                  <span>{t('cancelSelection')}</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4" />
                  <span>{t('selectPhotos')}</span>
                </>
              )}
            </button>
          )}

          {/* Gallery View Toggle */}
          {!isSelectMode && photos.length > 0 && (
            <button
              onClick={() => setViewMode(viewMode === "gallery" ? "default" : "gallery")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                viewMode === "gallery"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title={t('galleryView')}
            >
              <GalleryHorizontal className="h-4 w-4" />
              <span>{t('gallery')}</span>
            </button>
          )}

          {/* Sort Mode Toggle */}
          {!isSelectMode && viewMode !== "gallery" && (
            <div className="flex items-center bg-secondary/50 rounded-full p-1">
              <button
                onClick={() => setSortMode("newest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortMode === "newest"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t('newest')}
              >
                <Clock className="h-4 w-4" />
                <span>{t('newest')}</span>
              </button>
              <button
                onClick={() => setSortMode("popular")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  sortMode === "popular"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={t('popular')}
              >
                <TrendingUp className="h-4 w-4" />
                <span>{t('popular')}</span>
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
            <span className="text-sm text-muted-foreground">
              {isConnected ? t('live') : t('connecting')}
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle className="text-foreground hover:bg-secondary/50" />
        </div>

        {/* Controls - Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {/* Connection Status - Mobile */}
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? t('live') : t('connecting')}
            </span>
          </div>

          {/* Theme Toggle - Mobile (always visible) */}
          <ThemeToggle className="h-9 w-9 text-foreground hover:bg-secondary/50" />

          {/* Batch Selection Toggle - Mobile (always visible) */}
          {photos.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 ${
                isSelectMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
              }`}
              title={isSelectMode ? t('cancelSelection') : t('selectPhotos')}
            >
              {isSelectMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            </button>
          )}

          {/* Drawer Trigger */}
          <Dialog.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <Dialog.Trigger asChild>
              <button
                className="flex items-center justify-center h-9 w-9 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[80vh] flex-col rounded-t-2xl bg-background border border-border shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
                {/* Drawer Handle */}
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
                
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <Dialog.Title className="text-base font-semibold">
                    {t('settings') || 'Settings'}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-secondary transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* View Mode */}
                  {photos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">{t('view') || 'View'}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setViewMode("default");
                            setIsDrawerOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            viewMode === "default"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          {t('timeline')}
                        </button>
                        <button
                          onClick={() => {
                            setViewMode("gallery");
                            setIsDrawerOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            viewMode === "gallery"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                          )}
                        >
                          <GalleryHorizontal className="h-4 w-4" />
                          {t('gallery')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sort Mode */}
                  {viewMode !== "gallery" && (
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">{t('sortBy') || 'Sort by'}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSortMode("newest");
                            setIsDrawerOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            sortMode === "newest"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          {t('newest')}
                        </button>
                        <button
                          onClick={() => {
                            setSortMode("popular");
                            setIsDrawerOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            sortMode === "popular"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-secondary-foreground hover:bg-secondary"
                          )}
                        >
                          <TrendingUp className="h-4 w-4" />
                          {t('popular')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Selection Toolbar */}
      {isSelectMode && (
        <div className="max-w-screen-2xl mx-auto mt-3 flex items-center justify-between bg-secondary/50 backdrop-blur rounded-lg px-4 py-2 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground/80">
              {t('selectedCount', { count: selectedPhotos.size, total: photos.length })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('selectAll')}
              </button>
              <span className="text-border">|</span>
              <button
                onClick={deselectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
