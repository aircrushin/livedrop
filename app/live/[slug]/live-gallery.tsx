"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';
import { useBatchDownload } from "@/lib/hooks/use-batch-download";
import type { LiveDateFilter } from "@/lib/live-date-filter";
import { useLiveGallery } from "./use-live-gallery";
import { GalleryHeader } from "./gallery-header";
import { PhotoGrid } from "./photo-grid";
import { TimelineView } from "./timeline-view";
import { GalleryView } from "./gallery-view";
import { PhotoModal } from "./photo-modal";
import { ConnectionIndicator } from "./connection-indicator";
import type { Event } from "@/lib/supabase/types";
import type { PhotoWithLikes } from "./page";

export type ViewMode = "default" | "gallery";

interface LiveGalleryProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: PhotoWithLikes[];
  initialViewerCount: number;
  liveDateFilter: LiveDateFilter | null;
}

export function LiveGallery({ event, initialPhotos, initialViewerCount, liveDateFilter }: LiveGalleryProps) {
  const t = useTranslations('live');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithLikes | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  
  const {
    photos,
    isConnected,
    sortMode,
    setSortMode,
    viewerCount,
    currentUserId,
    likedPhotos,
    isSelectMode,
    setIsSelectMode,
    selectedPhotos,
    handleLikeChange,
    handleCommentChange,
    sortedPhotos,
    selectAll,
    deselectAll,
    togglePhotoSelection,
  } = useLiveGallery({ event, initialPhotos, initialViewerCount, dateFilter: liveDateFilter });

  const { isDownloading, downloadPhotos } = useBatchDownload({
    eventSlug: event.slug,
    onSuccess: () => {
      setIsSelectMode(false);
    },
    onError: (error) => {
      console.error("Batch download error:", error);
      alert(t('batchDownloadError'));
    },
  });

  const handleBatchDownload = async () => {
    if (selectedPhotos.size === 0) return;
    
    try {
      await downloadPhotos({
        photoIds: Array.from(selectedPhotos),
      });
    } catch {
      // Error handled in onError callback
    }
  };

  const handleDownload = async (photo: PhotoWithLikes) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${photo.storage_path}`;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `photo-${photo.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handlePhotoClick = (photo: PhotoWithLikes) => {
    if (isSelectMode) {
      togglePhotoSelection(photo.id);
    } else {
      setSelectedPhoto(photo);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GalleryHeader
        eventName={event.name}
        photos={photos}
        viewerCount={viewerCount}
        isConnected={isConnected}
        sortMode={sortMode}
        setSortMode={setSortMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSelectMode={isSelectMode}
        setIsSelectMode={setIsSelectMode}
        selectedPhotos={selectedPhotos}
        isDownloading={isDownloading}
        onBatchDownload={handleBatchDownload}
        selectAll={selectAll}
        deselectAll={deselectAll}
      />

      {viewMode === "gallery" ? (
        <GalleryView
          photos={sortedPhotos}
          likedPhotos={likedPhotos}
          currentUserId={currentUserId}
          isSelectMode={isSelectMode}
          selectedPhotos={selectedPhotos}
          onLikeChange={handleLikeChange}
          onToggleSelection={togglePhotoSelection}
          onPhotoClick={handlePhotoClick}
        />
      ) : sortMode === "newest" ? (
        <TimelineView
          photos={sortedPhotos}
          isSelectMode={isSelectMode}
          selectedPhotos={selectedPhotos}
          likedPhotos={likedPhotos}
          currentUserId={currentUserId}
          onPhotoClick={handlePhotoClick}
          onToggleSelection={togglePhotoSelection}
          onLikeChange={handleLikeChange}
        />
      ) : (
        <PhotoGrid
          photos={sortedPhotos}
          isSelectMode={isSelectMode}
          selectedPhotos={selectedPhotos}
          likedPhotos={likedPhotos}
          currentUserId={currentUserId}
          onPhotoClick={handlePhotoClick}
          onToggleSelection={togglePhotoSelection}
          onLikeChange={handleLikeChange}
        />
      )}

      {viewMode !== "gallery" && (
        <PhotoModal
          key={selectedPhoto?.id ?? "none"}
          photo={selectedPhoto}
          photos={sortedPhotos}
          currentUserId={currentUserId}
          likedPhotos={likedPhotos}
          onClose={() => setSelectedPhoto(null)}
          onLikeChange={handleLikeChange}
          onCommentChange={handleCommentChange}
          onDownload={handleDownload}
        />
      )}

      <ConnectionIndicator
        isConnected={isConnected}
        photoCount={sortedPhotos.length}
        label={t('photos')}
      />
    </div>
  );
}
