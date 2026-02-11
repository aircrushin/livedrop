"use client";

import { useState, useOptimistic, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { togglePhotoLike } from "@/lib/supabase/likes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  photoId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({
  photoId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
}: LikeButtonProps) {
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

  const handleClick = async () => {
    if (isPending) return;

    const newLiked = !liked;
    
    // Apply optimistic update immediately (wrapped in startTransition)
    startTransition(() => {
      addOptimistic(newLiked);
    });
    setIsPending(true);

    try {
      const result = await togglePhotoLike(photoId, userId);
      
      if (result.error) {
        // Revert on error
        console.error("Like error:", result.error);
      } else {
        // Update actual state
        setLiked(result.liked);
        setCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
        onLikeChange?.(result.liked, result.liked ? count + 1 : Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
        "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        optimisticState.liked
          ? "bg-red-500/20 text-red-500"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      )}
      title={optimisticState.liked ? "Unlike" : "Like"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={optimisticState.liked ? "liked" : "unliked"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              optimisticState.liked && "fill-current"
            )}
          />
        </motion.div>
      </AnimatePresence>
      <span className="text-sm font-medium min-w-[1rem] text-center">
        {optimisticState.count > 0 && optimisticState.count}
      </span>
    </button>
  );
}

// Compact version for grid view
export function LikeButtonCompact({
  photoId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);

  const [optimisticState, addOptimistic] = useOptimistic(
    { liked, count },
    (state, newLiked: boolean) => ({
      liked: newLiked,
      count: newLiked ? state.count + 1 : Math.max(0, state.count - 1),
    })
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    const newLiked = !liked;
    startTransition(() => {
      addOptimistic(newLiked);
    });
    setIsPending(true);

    try {
      const result = await togglePhotoLike(photoId, userId);
      
      if (result.error) {
        console.error("Like error:", result.error);
      } else {
        setLiked(result.liked);
        setCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
        onLikeChange?.(result.liked, result.liked ? count + 1 : Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200",
        "hover:scale-105 active:scale-95 disabled:opacity-50",
        optimisticState.liked
          ? "bg-red-500/20 text-red-500"
          : "bg-black/40 text-white/80 hover:bg-black/60"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={optimisticState.liked ? "liked" : "unliked"}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5",
              optimisticState.liked && "fill-current"
            )}
          />
        </motion.div>
      </AnimatePresence>
      {optimisticState.count > 0 && (
        <span className="text-xs font-medium">{optimisticState.count}</span>
      )}
    </button>
  );
}
