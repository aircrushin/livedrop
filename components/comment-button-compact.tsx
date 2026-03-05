"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { addPhotoComment, deletePhotoComment, getPhotoComments } from "@/lib/supabase/comments";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PhotoComment } from "@/lib/supabase/types";

interface CommentButtonCompactProps {
  photoId: string;
  userId: string;
  initialCount?: number;
  onCommentChange?: (count: number) => void;
}

interface CommentWithUser extends PhotoComment {
  isOwner?: boolean;
}

export function CommentButtonCompact({
  photoId,
  userId,
  initialCount = 0,
  onCommentChange,
}: CommentButtonCompactProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const formatTime = useCallback(
    (date: string) => {
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
    },
    [t]
  );

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPhotoComments(photoId);
      const loadedComments = (result.comments as PhotoComment[]).map((comment) => ({
        ...comment,
        isOwner: comment.user_id === userId,
      }));
      setComments(loadedComments);
      setCount(loadedComments.length);
      onCommentChange?.(loadedComments.length);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onCommentChange, photoId, userId]);

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [loadComments, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await addPhotoComment(photoId, userId, newComment.trim());
      if (result.comment) {
        const createdComment = result.comment as PhotoComment;
        setComments((prev) => [...prev, { ...createdComment, isOwner: true }]);
        setNewComment("");
        setCount((prev) => {
          const next = prev + 1;
          onCommentChange?.(next);
          return next;
        });
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
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        setCount((prev) => {
          const next = Math.max(0, prev - 1);
          onCommentChange?.(next);
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200",
            "hover:scale-105 active:scale-95",
            count > 0
              ? "bg-blue-500/20 text-blue-400"
              : "bg-black/40 text-white/80 hover:bg-black/60"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{count > 0 ? count : ""}</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <Dialog.Title className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <span>
                {t("comments")} ({count})
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-[160px] flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("noCommentsYet")}</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="group flex gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="break-words text-sm text-foreground">{comment.content}</p>
                      {comment.isOwner && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border/50 p-4">
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("writeComment")}
                maxLength={500}
                disabled={isSubmitting}
                className="h-9 flex-1"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {newComment.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">{newComment.length}/500</p>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
