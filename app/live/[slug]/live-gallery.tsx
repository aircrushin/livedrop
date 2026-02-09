"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getR2PublicUrl } from "@/lib/r2/utils";
import type { Event, Photo } from "@/lib/supabase/types";

interface LiveGalleryProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: Photo[];
}

export function LiveGallery({ event, initialPhotos }: LiveGalleryProps) {
  const t = useTranslations('live');
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const supabase = createClient();

  const getImageUrl = (storagePath: string) => {
    return getR2PublicUrl(storagePath);
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const url = getImageUrl(photo.storage_path);
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

  const handleZoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setImageScale(1);
  };

  const handlePreviousPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const previousIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    setSelectedPhoto(photos[previousIndex]);
    setImageScale(1);
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setSelectedPhoto(photos[nextIndex]);
    setImageScale(1);
  };

  // Poll for photos every 5 seconds as a fallback
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (data) {
        setPhotos(data as Photo[]);
      }
    };

    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, [event.id, supabase]);

  useEffect(() => {
    // Subscribe to new photos
    const channel = supabase
      .channel(`photos:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const newPhoto = payload.new as Photo;
          if (newPhoto.is_visible) {
            setPhotos((prev) => [newPhoto, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const updatedPhoto = payload.new as Photo;
          setPhotos((prev) => {
            if (updatedPhoto.is_visible) {
              // If photo is now visible and not in list, add it
              const exists = prev.find((p) => p.id === updatedPhoto.id);
              if (!exists) {
                return [updatedPhoto, ...prev];
              }
              // Update existing photo
              return prev.map((p) =>
                p.id === updatedPhoto.id ? updatedPhoto : p
              );
            } else {
              // Remove hidden photos
              return prev.filter((p) => p.id !== updatedPhoto.id);
            }
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const deletedPhoto = payload.old as Photo;
          setPhotos((prev) => prev.filter((p) => p.id !== deletedPhoto.id));
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;

      switch (e.key) {
        case "Escape":
          setSelectedPhoto(null);
          setImageScale(1);
          break;
        case "ArrowLeft":
          handlePreviousPhoto();
          break;
        case "ArrowRight":
          handleNextPhoto();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "0":
          handleResetZoom();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Camera className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wide">LiveDrop</p>
              <p className="font-bold text-lg">{event.name}</p>
            </div>
          </div>
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

      {/* Photo Grid */}
      {photos.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-white/40">
          <Camera className="h-24 w-24 mb-6 opacity-30" />
          <p className="text-2xl font-medium mb-2">{t('waitingForPhotos')}</p>
          <p className="text-lg">{t('scanPrompt')}</p>
        </div>
      ) : (
        <div className="pt-24 pb-8 px-4">
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 max-w-screen-2xl mx-auto">
            <AnimatePresence mode="popLayout">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="mb-4 break-inside-avoid"
                >
                  <div
                    className="relative rounded-lg overflow-hidden bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <Image
                      src={getImageUrl(photo.storage_path)}
                      alt="Event photo"
                      width={400}
                      height={400}
                      unoptimized
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
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
                    {photos.findIndex((p) => p.id === selectedPhoto.id) + 1} / {photos.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(selectedPhoto)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title={t('download')}
                  >
                    <Download className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => setSelectedPhoto(null)}
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
                    src={getImageUrl(selectedPhoto.storage_path)}
                    alt="Event photo"
                    className="max-w-full max-h-[calc(100vh-200px)] object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${imageScale})`,
                    }}
                    onDoubleClick={handleResetZoom}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  {/* Navigation */}
                  <button
                    onClick={handlePreviousPhoto}
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
                      disabled={imageScale <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4 text-white" />
                    </button>
                    <span className="text-white text-sm min-w-[3rem] text-center">
                      {Math.round(imageScale * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={imageScale >= 3}
                    >
                      <ZoomIn className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <button
                    onClick={handleNextPhoto}
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

      {/* Connection indicator pulse */}
      {isConnected && (
        <div className="fixed bottom-4 right-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-white/60">{photos.length} {t('photos')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
