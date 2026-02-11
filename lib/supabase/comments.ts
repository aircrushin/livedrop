"use server";

import { createClient } from "./server";
import type { PhotoComment } from "./types";

export async function addPhotoComment(
  photoId: string,
  userId: string,
  content: string
) {
  const supabase = await createClient();

  // Validate content
  if (!content.trim()) {
    return { error: "Comment cannot be empty", comment: null };
  }

  if (content.length > 500) {
    return { error: "Comment must be less than 500 characters", comment: null };
  }

  const { data: comment, error } = await supabase
    .from("photo_comments")
    .insert({
      photo_id: photoId,
      user_id: userId,
      content: content.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message, comment: null };
  }

  return { comment, error: null };
}

export async function getPhotoComments(photoId: string) {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("photo_comments")
    .select("*")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: true });

  if (error) {
    return { comments: [], error: error.message };
  }

  return { comments: comments || [], error: null };
}

export async function deletePhotoComment(commentId: string, userId: string) {
  const supabase = await createClient();

  // Verify ownership before deleting
  const { data: comment } = await supabase
    .from("photo_comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.user_id !== userId) {
    return { error: "Unauthorized", success: false };
  }

  const { error } = await supabase
    .from("photo_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: null };
}

export async function getPhotoCommentsCount(photoId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("photo_comments")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", photoId);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count || 0 };
}

export async function getEventPhotosWithCommentsCount(eventId: string) {
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("photos")
    .select(`
      *,
      comments_count:photo_comments(count)
    `)
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { photos: [], error: error.message };
  }

  // Transform the result to include comments_count
  const photosWithComments = (photos || []).map((photo) => {
    const photoData = photo as unknown as { comments_count: [{ count: number }] };
    return {
      ...photo,
      comments_count: photoData.comments_count?.[0]?.count || 0,
    };
  });

  return { photos: photosWithComments };
}

export type CommentWithUser = PhotoComment & {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      name?: string;
    };
  };
};
