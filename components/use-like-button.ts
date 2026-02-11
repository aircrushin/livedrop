"use client";

import { useState, useOptimistic, startTransition, useCallback } from "react";
import { togglePhotoLike } from "@/lib/supabase/likes";

interface UseLikeButtonProps {
  photoId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

interface UseLikeButtonReturn {
  liked: boolean;
  count: number;
  optimisticLiked: boolean;
  optimisticCount: number;
  isPending: boolean;
  handleToggle: () => Promise<void>;
}

export function useLikeButton({
  photoId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
}: UseLikeButtonProps): UseLikeButtonReturn {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  // Optimistic state
  const [optimisticState, addOptimistic] = useOptimistic(
    { liked, count },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : Math.max(0, state.count - 1),
    })
  );

  const handleToggle = useCallback(async () => {
    if (isPending) return;

    const newLiked = !liked;
    
    // Apply optimistic update immediately
    startTransition(() => {
      addOptimistic(newLiked);
    });
    setIsPending(true);

    try {
      const result = await togglePhotoLike(photoId, userId);
      
      if (result.error) {
        console.error("Like error:", result.error);
      } else {
        // Update actual state
        setLiked(result.liked);
        const newCount = result.liked ? count + 1 : Math.max(0, count - 1);
        setCount(newCount);
        onLikeChange?.(result.liked, newCount);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsPending(false);
    }
  }, [liked, count, isPending, photoId, userId, onLikeChange, addOptimistic]);

  return {
    liked,
    count,
    optimisticLiked: optimisticState.liked,
    optimisticCount: optimisticState.count,
    isPending,
    handleToggle,
  };
}
