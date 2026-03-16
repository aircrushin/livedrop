"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { LikeButtonCompact } from "@/components/like-button";
import { CommentButtonCompact } from "@/components/comment-section";
import type { PhotoWithLikes } from "./page";

interface GalleryViewProps {
  photos: PhotoWithLikes[];
  likedPhotos: Set<string>;
  currentUserId: string | null;
  isSelectMode: boolean;
  selectedPhotos: Set<string>;
  onLikeChange: (photoId: string, liked: boolean) => void;
  onToggleSelection: (photoId: string) => void;
  onPhotoClick: (photo: PhotoWithLikes) => void;
}

// How many pixels adjacent cards are offset from center.
// Derived dynamically from container width in the component.
const CARD_WIDTH_RATIO = 0.74; // card = 74% of container
const SLIDE_OFFSET_RATIO = 0.82; // center-to-center gap as fraction of container

export function GalleryView({
  photos,
  likedPhotos,
  currentUserId,
  isSelectMode,
  selectedPhotos,
  onLikeChange,
  onToggleSelection,
  onPhotoClick,
}: GalleryViewProps) {
  const t = useTranslations("live");
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);

  // Measure the stage so we can place cards in pixels
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbnailsRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>("[data-active='true']");
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentIndex, photos.length]);

  const goTo = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) goTo(currentIndex + 1);
  }, [currentIndex, photos.length, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground/60">
        <svg
          className="h-24 w-24 mb-6 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-2xl font-medium mb-2">{t("waitingForPhotos")}</p>
        <p className="text-lg">{t("scanPrompt")}</p>
      </div>
    );
  }

  const boundedIndex = Math.min(currentIndex, photos.length - 1);
  const isFirst = boundedIndex === 0;
  const isLast = boundedIndex === photos.length - 1;

  // Pixel dimensions derived from measured stage
  const cardWidth = stageWidth * CARD_WIDTH_RATIO;
  const slideOffset = stageWidth * SLIDE_OFFSET_RATIO;
  // Card left edge so it's horizontally centered in the stage
  const cardLeft = (stageWidth - cardWidth) / 2;

  // Only render photos within 1 step of current index
  const visiblePhotos = photos
    .map((photo, i) => ({ photo, index: i, offset: i - boundedIndex }))
    .filter(({ offset }) => Math.abs(offset) <= 1);

  return (
    <div className="flex flex-col h-screen pt-[112px] overflow-hidden bg-background">
      {/* Counter */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <span className="text-sm text-muted-foreground tabular-nums">
          {boundedIndex + 1} / {photos.length}
        </span>
      </div>

      {/* Main photo stage */}
      <div
        ref={stageRef}
        className="flex-1 relative min-h-0 overflow-hidden"
      >
        {/* Left arrow — sits above the stage */}
        <button
          onClick={goToPrev}
          disabled={isFirst}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 shadow-xl hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>

        {/* Cards */}
        <AnimatePresence initial={false}>
          {stageWidth > 0 && visiblePhotos.map(({ photo, offset }) => {
            const isCurrent = offset === 0;
            const isPeek = !isCurrent;

            return (
              <motion.div
                key={photo.id}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: cardLeft,
                  width: cardWidth,
                }}
                initial={{
                  x: offset > 0 ? slideOffset * 1.3 : -slideOffset * 1.3,
                  scale: 0.78,
                  opacity: 0,
                }}
                animate={{
                  x: offset * slideOffset,
                  scale: isCurrent ? 1 : 0.84,
                  opacity: isCurrent ? 1 : 0.42,
                }}
                exit={{
                  x: offset > 0 ? slideOffset * 1.3 : -slideOffset * 1.3,
                  scale: 0.78,
                  opacity: 0,
                  transition: { duration: 0.18, ease: "easeIn" },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
                className={`flex items-center justify-center ${isPeek ? "cursor-pointer" : ""}`}
                onClick={isPeek ? () => goTo(boundedIndex + offset) : undefined}
              >
                {/* Card */}
                <div
                  className={`relative w-full h-full flex items-center justify-center ${isCurrent ? "cursor-pointer" : ""}`}
                  onClick={isCurrent ? () => onPhotoClick(photo) : undefined}
                >
                  <img
                    src={getR2PublicUrl(photo.storage_path)}
                    alt="Event photo"
                    className="max-w-full max-h-[calc(100vh-270px)] object-contain rounded-2xl shadow-2xl select-none"
                    draggable={false}
                  />

                  {/* Frosted dimming overlay on peek cards */}
                  {isPeek && (
                    <div className="absolute inset-0 rounded-2xl bg-background/30 backdrop-blur-[1px]" />
                  )}

                  {/* Like / comment overlay — only on current */}
                  {isCurrent && !isSelectMode && currentUserId && (
                    <div
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-border/40 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LikeButtonCompact
                        photoId={photo.id}
                        userId={currentUserId}
                        initialLiked={likedPhotos.has(photo.id)}
                        initialCount={photo.likes_count}
                        onLikeChange={(liked) => onLikeChange(photo.id, liked)}
                      />
                      <div className="w-px h-4 bg-border/50" />
                      <CommentButtonCompact
                        photoId={photo.id}
                        userId={currentUserId}
                        initialCount={photo.comments_count}
                      />
                    </div>
                  )}

                  {/* Select overlay — only on current */}
                  {isCurrent && isSelectMode && (
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(photo.id);
                      }}
                    >
                      {selectedPhotos.has(photo.id) && (
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl ring-4 ring-primary" />
                      )}
                      <div className="absolute top-3 right-3">
                        {selectedPhotos.has(photo.id) ? (
                          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <svg
                              className="h-4 w-4 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full border-2 border-white/80 bg-black/30 shadow-lg" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Right arrow */}
        <button
          onClick={goToNext}
          disabled={isLast}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-background/85 backdrop-blur-sm border border-border/60 shadow-xl hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>

        {/* Edge fade masks to soften the peek crop */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-background to-transparent z-10" />
      </div>

      {/* Thumbnail filmstrip */}
      <div className="shrink-0 pb-4 pt-3">
        <div
          ref={thumbnailsRef}
          className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-none [scrollbar-width:none]"
        >
          <div className="shrink-0 w-2" />
          {photos.map((photo, i) => {
            const isActive = i === boundedIndex;
            return (
              <button
                key={photo.id}
                data-active={isActive ? "true" : "false"}
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1}`}
                className={`shrink-0 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "w-16 h-16 ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg shadow-primary/20 opacity-100"
                    : "w-14 h-14 opacity-50 hover:opacity-80 hover:scale-105"
                }`}
              >
                <img
                  src={getR2PublicUrl(photo.storage_path)}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            );
          })}
          <div className="shrink-0 w-2" />
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-muted-foreground/40 text-xs mt-2 hidden sm:block">
          ← → {t("keyboardHints").split("•")[2]?.trim() ?? "Arrow keys to navigate"}
        </p>
      </div>
    </div>
  );
}
