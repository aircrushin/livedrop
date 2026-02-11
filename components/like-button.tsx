"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLikeButton } from "./use-like-button";

interface LikeButtonProps {
  photoId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

interface LikeButtonBaseProps extends LikeButtonProps {
  compact?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function LikeIcon({ liked, compact }: { liked: boolean; compact?: boolean }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={liked ? "liked" : "unliked"}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Heart
          className={cn(
            "transition-all duration-200",
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
            liked && "fill-current"
          )}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function LikeButtonBase({
  photoId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
  compact = false,
  onClick,
}: LikeButtonBaseProps) {
  const { optimisticLiked, optimisticCount, isPending, handleToggle } = useLikeButton({
    photoId,
    userId,
    initialLiked,
    initialCount,
    onLikeChange,
  });

  const handleClick = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    await handleToggle();
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200",
          "hover:scale-105 active:scale-95 disabled:opacity-50",
          optimisticLiked
            ? "bg-red-500/20 text-red-500"
            : "bg-black/40 text-white/80 hover:bg-black/60"
        )}
      >
        <LikeIcon liked={optimisticLiked} compact />
        {optimisticCount > 0 && (
          <span className="text-xs font-medium">{optimisticCount}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
        "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        optimisticLiked
          ? "bg-red-500/20 text-red-500"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      )}
      title={optimisticLiked ? "Unlike" : "Like"}
    >
      <LikeIcon liked={optimisticLiked} />
      <span className="text-sm font-medium min-w-[1rem] text-center">
        {optimisticCount > 0 && optimisticCount}
      </span>
    </button>
  );
}

export function LikeButton(props: LikeButtonProps) {
  return <LikeButtonBase {...props} />;
}

export function LikeButtonCompact(props: LikeButtonProps) {
  return <LikeButtonBase {...props} compact />;
}
