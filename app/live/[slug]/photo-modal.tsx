"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { LikeButton } from "@/components/like-button";
import { CommentSection } from "@/components/comment-section";
import type { PhotoWithLikes } from "./page";

interface PhotoModalProps {
  photo: PhotoWithLikes | null;
  photos: PhotoWithLikes[];
  currentUserId: string | null;
  likedPhotos: Set<string>;
  onClose: () => void;
  onLikeChange: (photoId: string, liked: boolean) => void;
  onCommentChange: (photoId: string, count: number) => void;
  onDownload: (photo: PhotoWithLikes) => void;
}

function useKeyboardNavigation({
  photos,
  currentPhoto,
  onNavigate,
  onClose,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: {
  photos: PhotoWithLikes[];
  currentPhoto: PhotoWithLikes | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPhoto) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          navigatePrevious();
          break;
        case "ArrowRight":
          navigateNext();
          break;
        case "+":
        case "=":
          onZoomIn();
          break;
        case "-":
          onZoomOut();
          break;
        case "0":
          onResetZoom();
          break;
      }
    };

    const currentIndex = photos.findIndex((p) => p.id === currentPhoto?.id);

    function navigatePrevious() {
      if (currentIndex === -1) return;
      const previousIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
      onNavigate(previousIndex);
    }

    function navigateNext() {
      if (currentIndex === -1) return;
      const nextIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
      onNavigate(nextIndex);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhoto, photos, onNavigate, onClose, onZoomIn, onZoomOut, onResetZoom]);
}

export function PhotoModal({
  photo,
  photos,
  currentUserId,
  likedPhotos,
  onClose,
  onLikeChange,
  onCommentChange,
  onDownload,
}: PhotoModalProps) {
  const t = useTranslations('live');
  const [scale, setScale] = useState(1);
  const [currentPhoto, setCurrentPhoto] = useState(photo);

  // Update currentPhoto when photo prop changes
  useEffect(() => {
    setCurrentPhoto(photo);
    if (photo) setScale(1);
  }, [photo]);

  const currentIndex = photos.findIndex((p) => p.id === currentPhoto?.id);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setCurrentPhoto(photos[index]);
    setScale(1);
  }, [photos]);

  useKeyboardNavigation({
    photos,
    currentPhoto,
    onNavigate: handleNavigate,
    onClose,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetZoom: handleResetZoom,
  });

  if (!currentPhoto) return null;

  const handlePrevious = () => {
    const previousIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(previousIndex);
  };

  const handleNext = () => {
    const nextIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    handleNavigate(nextIndex);
  };

  return (
    <AnimatePresence>
      {currentPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative w-full h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">
                  {currentIndex + 1} / {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownload(currentPhoto)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title={t('download')}
                >
                  <Download className="h-5 w-5 text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <div className="relative max-w-full max-h-full">
                <img
                  src={getR2PublicUrl(currentPhoto.storage_path)}
                  alt="Event photo"
                  className="max-w-full max-h-[calc(100vh-280px)] object-contain transition-transform duration-200"
                  style={{ transform: `scale(${scale})` }}
                  onDoubleClick={handleResetZoom}
                />
              </div>
            </div>

            {/* Interaction Bar */}
            {currentUserId && (
              <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent">
                <div className="max-w-md mx-auto flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-4">
                    <LikeButton
                      photoId={currentPhoto.id}
                      userId={currentUserId}
                      initialLiked={likedPhotos.has(currentPhoto.id)}
                      initialCount={currentPhoto.likes_count}
                      onLikeChange={(liked) => onLikeChange(currentPhoto.id, liked)}
                    />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white/70">
                        {currentPhoto.comments_count} {t('comments')}
                      </span>
                    </div>
                  </div>
                  <CommentSection
                    photoId={currentPhoto.id}
                    userId={currentUserId}
                    initialCount={currentPhoto.comments_count}
                    onCommentChange={(count) => onCommentChange(currentPhoto.id, count)}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Navigation */}
                <button
                  onClick={handlePrevious}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={photos.length <= 1}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 py-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4 text-white" />
                  </button>
                  <span className="text-white text-sm min-w-[3rem] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={scale >= 3}
                  >
                    <ZoomIn className="h-4 w-4 text-white" />
                  </button>
                </div>

                <button
                  onClick={handleNext}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={photos.length <= 1}
                >
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Keyboard shortcuts hint */}
              <p className="text-center text-white/40 text-xs mt-3">
                {t('keyboardHints')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
