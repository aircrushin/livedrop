"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  LayoutGrid, 
  Clock,
  Square,
  CheckSquare,
  Loader2,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getR2PublicUrl } from "@/lib/r2/utils";
import { useBatchDownload } from "@/lib/hooks/use-batch-download";
import { useViewerTracking } from "@/lib/hooks/use-viewer-tracking";
import { LikeButton, LikeButtonCompact } from "@/components/like-button";
import { CommentSection, CommentButtonCompact } from "@/components/comment-section";
import type { Event } from "@/lib/supabase/types";
import type { PhotoWithLikes } from "./page";

type ViewMode = "timeline" | "grid";
type SortMode = "newest" | "popular";

interface LiveGalleryProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: PhotoWithLikes[];
}

const STORAGE_KEY = `livedrop-view-mode-${typeof window !== 'undefined' ? window.location.pathname : ''}`;
const SORT_KEY = `livedrop-sort-mode-${typeof window !== 'undefined' ? window.location.pathname : ''}`;

export function LiveGallery({ event, initialPhotos }: LiveGalleryProps) {
  const t = useTranslations('live');
  const [photos, setPhotos] = useState<PhotoWithLikes[]>(initialPhotos);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithLikes | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  
  // Batch selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  
  const supabase = createClient();

  const { isDownloading, downloadPhotos } = useBatchDownload({
    eventSlug: event.slug,
    onSuccess: () => {
      setIsSelectMode(false);
      setSelectedPhotos(new Set());
    },
    onError: (error) => {
      console.error("Batch download error:", error);
      alert(t('batchDownloadError'));
    },
  });

  useViewerTracking(event.id);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Load which photos user has liked
        const { data: likes } = await supabase
          .from("photo_likes")
          .select("photo_id")
          .eq("user_id", user.id);
        if (likes) {
          setLikedPhotos(new Set(likes.map((l) => l.photo_id)));
        }
      }
    };
    getUser();
  }, [supabase]);

  // Load view mode and sort mode from localStorage on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedView = localStorage.getItem(STORAGE_KEY);
    const savedSort = localStorage.getItem(SORT_KEY);
    if (savedView === "timeline" || savedView === "grid") {
      setViewMode(savedView);
    }
    if (savedSort === "newest" || savedSort === "popular") {
      setSortMode(savedSort);
    }
  }, [mounted]);

  // Save preferences to localStorage when changed
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SORT_KEY, sortMode);
  }, [sortMode, mounted]);

  // Sort photos based on sort mode
  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortMode === "popular") {
      if (b.likes_count !== a.likes_count) {
        return b.likes_count - a.likes_count;
      }
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getImageUrl = (storagePath: string) => {
    return getR2PublicUrl(storagePath);
  };

  const handleDownload = async (photo: PhotoWithLikes) => {
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

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedPhotos(new Set());
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

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
    const currentIndex = sortedPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const previousIndex = currentIndex === sortedPhotos.length - 1 ? 0 : currentIndex + 1;
    setSelectedPhoto(sortedPhotos[previousIndex]);
    setImageScale(1);
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = sortedPhotos.findIndex((p) => p.id === selectedPhoto.id);
    const nextIndex = currentIndex === 0 ? sortedPhotos.length - 1 : currentIndex - 1;
    setSelectedPhoto(sortedPhotos[nextIndex]);
    setImageScale(1);
  };

  // Handle like updates
  const handleLikeChange = useCallback((photoId: string, liked: boolean) => {
    setLikedPhotos((prev) => {
      const newSet = new Set(prev);
      if (liked) {
        newSet.add(photoId);
      } else {
        newSet.delete(photoId);
      }
      return newSet;
    });

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, likes_count: liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
          : p
      )
    );
  }, []);

  // Handle comment count updates
  const handleCommentChange = useCallback((photoId: string, newCount: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, comments_count: newCount } : p))
    );
  }, []);

  // Poll for photos every 5 seconds as a fallback
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from("photos")
        .select(`
          *,
          likes_count:photo_likes(count),
          comments_count:photo_comments(count)
        `)
        .eq("event_id", event.id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (data) {
        const photosWithCounts = data.map((photo) => ({
          ...photo,
          likes_count: (photo as unknown as { likes_count: [{ count: number }] }).likes_count?.[0]?.count || 0,
          comments_count: (photo as unknown as { comments_count: [{ count: number }] }).comments_count?.[0]?.count || 0,
        })) as PhotoWithLikes[];
        setPhotos(photosWithCounts);
      }
    };

    const interval = setInterval(fetchPhotos, 5000);
    return () => clearInterval(interval);
  }, [event.id, supabase]);

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to photos
    const photosChannel = supabase
      .channel(`photos:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        (payload: { new: PhotoWithLikes }) => {
          const newPhoto = payload.new;
          if (newPhoto.is_visible) {
            setPhotos((prev) => [
              { ...newPhoto, likes_count: 0, comments_count: 0 },
              ...prev,
            ]);
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
        (payload: { new: PhotoWithLikes }) => {
          const updatedPhoto = payload.new;
          setPhotos((prev) => {
            if (updatedPhoto.is_visible) {
              const exists = prev.find((p) => p.id === updatedPhoto.id);
              if (!exists) {
                return [
                  { ...updatedPhoto, likes_count: 0, comments_count: 0 },
                  ...prev,
                ];
              }
              return prev.map((p) =>
                p.id === updatedPhoto.id ? { ...p, ...updatedPhoto } : p
              );
            } else {
              return prev.filter((p) => p.id !== updatedPhoto.id);
            }
          });
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Subscribe to likes - only INSERT events
    const likesChannel = supabase
      .channel(`likes:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photo_likes",
        },
        (payload: { new: { photo_id: string; user_id: string } }) => {
          const { photo_id, user_id } = payload.new;
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo_id ? { ...p, likes_count: p.likes_count + 1 } : p
            )
          );
          if (user_id === currentUserId) {
            setLikedPhotos((prev) => new Set(prev).add(photo_id));
          }
        }
      )
      .subscribe();

    // Subscribe to comments - only INSERT events
    const commentsChannel = supabase
      .channel(`comments:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photo_comments",
        },
        (payload: { new: { photo_id: string } }) => {
          const { photo_id } = payload.new;
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo_id ? { ...p, comments_count: p.comments_count + 1 } : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(photosChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [event.id, supabase, currentUserId]);

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
  }, [selectedPhoto, sortedPhotos]);

  const renderPhotoItem = (photo: PhotoWithLikes, index: number) => {
    const isSelected = selectedPhotos.has(photo.id);
    
    return (
      <motion.div
        key={photo.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index < 12 ? index * 0.04 : 0,
        }}
        className={viewMode === "timeline" ? "mb-4 break-inside-avoid" : "aspect-square"}
      >
        <div
          className={`relative ${viewMode === "grid" ? "w-full h-full" : ""} rounded-lg overflow-hidden bg-white/5 cursor-pointer hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] ${
            isSelected ? "ring-4 ring-primary" : ""
          }`}
          onClick={() => {
            if (isSelectMode) {
              togglePhotoSelection(photo.id);
            } else {
              setSelectedPhoto(photo);
            }
          }}
        >
          {isSelectMode && (
            <div className="absolute top-2 right-2 z-10">
              {isSelected ? (
                <CheckSquare className="h-6 w-6 text-primary fill-primary" />
              ) : (
                <Square className="h-6 w-6 text-white/70" />
              )}
            </div>
          )}
          
          {/* Interaction overlay */}
          {!isSelectMode && currentUserId && (
            <div 
              className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <LikeButtonCompact
                photoId={photo.id}
                userId={currentUserId}
                initialLiked={likedPhotos.has(photo.id)}
                initialCount={photo.likes_count}
                onLikeChange={(liked) => handleLikeChange(photo.id, liked)}
              />
              <CommentButtonCompact
                photoId={photo.id}
                userId={currentUserId}
                initialCount={photo.comments_count}
              />
            </div>
          )}

          {viewMode === "timeline" ? (
            <Image
              src={getImageUrl(photo.storage_path)}
              alt="Event photo"
              width={400}
              height={400}
              unoptimized
              className="w-full h-auto"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <Image
              src={getImageUrl(photo.storage_path)}
              alt="Event photo"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            />
          )}
        </div>
      </motion.div>
    );
  };

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
          <div className="flex items-center gap-4">
            {/* Batch Selection Toggle */}
            {photos.length > 0 && mounted && (
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
            {mounted && !isSelectMode && (
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

            {/* View Mode Toggle */}
            {/* {mounted && !isSelectMode && (
              <div className="flex items-center bg-white/10 rounded-full p-1">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === "timeline"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/60 hover:text-white/80"
                  }`}
                  title={t('timelineView')}
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('timeline')}</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-white/60 hover:text-white/80"
                  }`}
                  title={t('gridView')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('grid')}</span>
                </button>
              </div>
            )} */}

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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-screen-2xl mx-auto mt-3 flex items-center justify-between bg-white/10 backdrop-blur rounded-lg px-4 py-2"
          >
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
              onClick={handleBatchDownload}
              disabled={selectedPhotos.size === 0 || isDownloading}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? t('packaging') : t('downloadSelected')}
            </button>
          </motion.div>
        )}
      </div>

      {/* Photo Grid */}
      {sortedPhotos.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-white/40">
          <Camera className="h-24 w-24 mb-6 opacity-30" />
          <p className="text-2xl font-medium mb-2">{t('waitingForPhotos')}</p>
          <p className="text-lg">{t('scanPrompt')}</p>
        </div>
      ) : (
        <div className="pt-24 pb-8 px-4">
          <AnimatePresence mode="wait">
            {viewMode === "timeline" ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 max-w-screen-2xl mx-auto"
              >
                <AnimatePresence mode="popLayout">
                  {sortedPhotos.map((photo, index) => renderPhotoItem(photo, index))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-w-screen-2xl mx-auto"
              >
                <AnimatePresence mode="popLayout">
                  {sortedPhotos.map((photo, index) => renderPhotoItem(photo, index))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && !isSelectMode && (
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
                    {sortedPhotos.findIndex((p) => p.id === selectedPhoto.id) + 1} / {sortedPhotos.length}
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
                    className="max-w-full max-h-[calc(100vh-280px)] object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${imageScale})`,
                    }}
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
                        photoId={selectedPhoto.id}
                        userId={currentUserId}
                        initialLiked={likedPhotos.has(selectedPhoto.id)}
                        initialCount={selectedPhoto.likes_count}
                        onLikeChange={(liked) => handleLikeChange(selectedPhoto.id, liked)}
                      />
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
                        <MessageCircle className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-white/70">
                          {selectedPhoto.comments_count} {t('comments')}
                        </span>
                      </div>
                    </div>
                    <CommentSection
                      photoId={selectedPhoto.id}
                      userId={currentUserId}
                      initialCount={selectedPhoto.comments_count}
                      onCommentChange={(count) => handleCommentChange(selectedPhoto.id, count)}
                    />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="p-4">
                <div className="flex items-center justify-center gap-4">
                  {/* Navigation */}
                  <button
                    onClick={handlePreviousPhoto}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={sortedPhotos.length <= 1}
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
                    disabled={sortedPhotos.length <= 1}
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
            <span className="text-xs text-white/60">{sortedPhotos.length} {t('photos')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
