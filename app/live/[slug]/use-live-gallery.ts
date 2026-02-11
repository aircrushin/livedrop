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

export type ViewMode = "timeline" | "grid";
export type SortMode = "newest" | "popular";

export interface UseLiveGalleryProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: PhotoWithLikes[];
}

export interface UseLiveGalleryReturn {
  photos: PhotoWithLikes[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoWithLikes[]>>;
  isConnected: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  currentUserId: string | null;
  likedPhotos: Set<string>;
  setLikedPhotos: React.Dispatch<React.SetStateAction<Set<string>>>;
  isSelectMode: boolean;
  setIsSelectMode: (value: boolean) => void;
  selectedPhotos: Set<string>;
  setSelectedPhotos: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleLikeChange: (photoId: string, liked: boolean) => void;
  handleCommentChange: (photoId: string, newCount: number) => void;
  sortedPhotos: PhotoWithLikes[];
  selectAll: () => void;
  deselectAll: () => void;
  togglePhotoSelection: (photoId: string) => void;
}

export function useLiveGallery({ event, initialPhotos }: UseLiveGalleryProps): UseLiveGalleryReturn {
  const [photos, setPhotos] = useState<PhotoWithLikes[]>(initialPhotos);
  const [isConnected, setIsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  
  const supabase = createClient();

  useViewerTracking(event.id);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
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

  // Load view mode and sort mode from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem(`livedrop-view-mode-${window.location.pathname}`);
    const savedSort = localStorage.getItem(`livedrop-sort-mode-${window.location.pathname}`);
    if (savedView === "timeline" || savedView === "grid") {
      setViewMode(savedView);
    }
    if (savedSort === "newest" || savedSort === "popular") {
      setSortMode(savedSort);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`livedrop-view-mode-${window.location.pathname}`, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(`livedrop-sort-mode-${window.location.pathname}`, sortMode);
  }, [sortMode]);

  // Sort photos
  const sortedPhotos = [...photos].sort((a, b) => {
    if (sortMode === "popular") {
      if (b.likes_count !== a.likes_count) {
        return b.likes_count - a.likes_count;
      }
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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

  const selectAll = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
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

  return {
    photos,
    setPhotos,
    isConnected,
    viewMode,
    setViewMode,
    sortMode,
    setSortMode,
    currentUserId,
    likedPhotos,
    setLikedPhotos,
    isSelectMode,
    setIsSelectMode,
    selectedPhotos,
    setSelectedPhotos,
    handleLikeChange,
    handleCommentChange,
    sortedPhotos,
    selectAll,
    deselectAll,
    togglePhotoSelection,
  };
}
