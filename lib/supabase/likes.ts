"use server";

import { createClient } from "./server";
// Likes actions for photo social features

export async function togglePhotoLike(photoId: string, userId: string) {
  const supabase = await createClient();

  // Check if like already exists
  const { data: existingLike } = await supabase
    .from("photo_likes")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", userId)
    .single();

  if (existingLike) {
    // Unlike: remove the like
    const { error } = await supabase
      .from("photo_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      return { error: error.message, liked: true };
    }

    return { liked: false };
  } else {
    // Like: add new like
    const { error } = await supabase
      .from("photo_likes")
      .insert({
        photo_id: photoId,
        user_id: userId,
      });

    if (error) {
      return { error: error.message, liked: false };
    }

    return { liked: true };
  }
}

export async function getPhotoLikesCount(photoId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("photo_likes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", photoId);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count || 0 };
}

export async function hasUserLikedPhoto(photoId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("photo_likes")
    .select("id")
    .eq("photo_id", photoId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return { liked: false };
  }

  return { liked: !!data };
}

export async function getEventPhotosWithLikes(eventId: string) {
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("photos")
    .select(`
      *,
      likes_count:photo_likes(count)
    `)
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { photos: [], error: error.message };
  }

  // Transform the result to include likes_count
  const photosWithLikes = (photos || []).map((photo) => ({
    ...photo,
    likes_count: (photo as unknown as { likes_count: [{ count: number }] }).likes_count?.[0]?.count || 0,
  }));

  return { photos: photosWithLikes };
}

export async function getPopularPhotos(eventId: string, limit: number = 20) {
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("photos")
    .select(`
      *,
      likes_count:photo_likes(count)
    `)
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { photos: [], error: error.message };
  }

  // Transform and sort by likes count
  const photosWithLikes = (photos || []).map((photo) => {
    const photoData = photo as unknown as { likes_count: [{ count: number }] };
    return {
      ...photo,
      likes_count: photoData.likes_count?.[0]?.count || 0,
    };
  });

  // Sort by likes count descending, then by created_at descending
  const sortedPhotos = photosWithLikes.sort((a, b) => {
    const photoA = a as unknown as { likes_count: number; created_at: string };
    const photoB = b as unknown as { likes_count: number; created_at: string };
    if (photoB.likes_count !== photoA.likes_count) {
      return photoB.likes_count - photoA.likes_count;
    }
    return new Date(photoB.created_at).getTime() - new Date(photoA.created_at).getTime();
  });

  return { photos: sortedPhotos.slice(0, limit) };
}
