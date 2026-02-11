"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentButtonCompactProps {
  photoId: string;
  userId: string;
  initialCount?: number;
  onCommentChange?: (count: number) => void;
}

export function CommentButtonCompact({
  photoId: _photoId,
  userId: _userId,
  initialCount = 0,
}: CommentButtonCompactProps) {
  const count = initialCount;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        // Open comments in a modal or expand
      }}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200",
        "hover:scale-105",
        count > 0
          ? "bg-blue-500/20 text-blue-400"
          : "bg-black/40 text-white/80 hover:bg-black/60"
      )}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{count > 0 ? count : ""}</span>
    </button>
  );
}
