"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { addPhotoComment, getPhotoComments, deletePhotoComment } from "@/lib/supabase/comments";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PhotoComment } from "@/lib/supabase/types";

export { CommentButtonCompact } from "./comment-button-compact";

interface CommentSectionProps {
  photoId: string;
  userId: string;
  initialCount?: number;
  onCommentChange?: (count: number) => void;
}

interface CommentWithUser extends PhotoComment {
  isOwner?: boolean;
}

function useTimeFormatter() {
  const t = useTranslations();
  
  return useCallback((date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diff = now.getTime() - commentDate.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    if (hours < 24) return t("hoursAgo", { count: hours });
    if (days < 7) return t("daysAgo", { count: days });
    return commentDate.toLocaleDateString();
  }, [t]);
}

function CommentList({
  comments,
  isLoading,
  onDelete,
  formatTime,
}: {
  comments: CommentWithUser[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  formatTime: (date: string) => string;
}) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 text-white/60 animate-spin" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-center text-white/40 text-sm py-4">
        {t("noCommentsYet")}
      </p>
    );
  }

  return (
    <AnimatePresence>
      {comments.map((comment) => (
        <motion.div
          key={comment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="group flex gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-white/90 break-words flex-1">
                {comment.content}
              </p>
              {comment.isOwner && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-opacity"
                  title={t("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-white/40">
              {formatTime(comment.created_at)}
            </span>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations();

  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-white/10">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("writeComment")}
          maxLength={500}
          disabled={isSubmitting}
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9"
        />
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      {value.length > 0 && (
        <p className="text-xs text-white/40 mt-1">
          {value.length}/500
        </p>
      )}
    </form>
  );
}

export function CommentSection({
  photoId,
  userId,
  initialCount = 0,
  onCommentChange,
}: CommentSectionProps) {
  const t = useTranslations();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount);
  const formatTime = useTimeFormatter();

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPhotoComments(photoId);
      const loadedComments = result.comments as PhotoComment[];
      const commentsWithOwner: CommentWithUser[] = loadedComments.map((comment) => ({
        ...comment,
        isOwner: comment.user_id === userId,
      }));
      setComments(commentsWithOwner);
      setCount(commentsWithOwner.length);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [photoId, userId]);

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await addPhotoComment(photoId, userId, newComment.trim());
      
      if (result.comment) {
        const newCommentData = result.comment as PhotoComment;
        const commentWithOwner: CommentWithUser = { ...newCommentData, isOwner: true };
        setComments((prev) => [...prev, commentWithOwner]);
        setCount((prev) => prev + 1);
        setNewComment("");
        onCommentChange?.(count + 1);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const result = await deletePhotoComment(commentId, userId);
      
      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setCount((prev) => Math.max(0, prev - 1));
        onCommentChange?.(Math.max(0, count - 1));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  // Collapsed state - button only
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200",
          "hover:scale-105 active:scale-95",
          count > 0
            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            : "bg-white/10 text-white/70 hover:bg-white/20"
        )}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {count > 0 ? count : t("comments")}
        </span>
      </button>
    );
  }

  // Expanded state - full comment section
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-black/60 backdrop-blur rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">
            {t("comments")} ({count})
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-white/60 hover:text-white text-sm"
        >
          {t("close")}
        </button>
      </div>

      {/* Comments List */}
      <div className="max-h-60 overflow-y-auto p-4 space-y-3">
        <CommentList
          comments={comments}
          isLoading={isLoading}
          onDelete={handleDelete}
          formatTime={formatTime}
        />
      </div>

      {/* Input */}
      <CommentInput
        value={newComment}
        onChange={setNewComment}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
}
