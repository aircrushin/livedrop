"use server";

import { createClient } from "./server";
import type { Photo } from "./types";

export interface EventStatistics {
  totalPhotos: number;
  todayPhotos: number;
  onlineViewers: number;
  totalDownloads: number;
  uploadDistribution: { hour: number; count: number }[];
}

export async function getEventStatistics(eventId: string): Promise<EventStatistics> {
  const supabase = await createClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  
  const [totalPhotosResult, todayPhotosResult, viewersResult, downloadsResult, distributionResult] = await Promise.all([
    supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId),
    
    supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .gte("created_at", todayIso),
    
    supabase
      .from("event_viewers")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    
    supabase
      .from("photos")
      .select("download_count")
      .eq("event_id", eventId),
    
    supabase
      .from("photos")
      .select("created_at")
      .eq("event_id", eventId)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ]);

  const totalPhotos = totalPhotosResult.count || 0;
  const todayPhotos = todayPhotosResult.count || 0;
  const onlineViewers = viewersResult.count || 0;
  const totalDownloads = (downloadsResult.data || []).reduce((sum, photo) => sum + (photo.download_count || 0), 0);
  
  const distribution = calculateUploadDistribution(distributionResult.data || []);
  
  return {
    totalPhotos,
    todayPhotos,
    onlineViewers,
    totalDownloads,
    uploadDistribution: distribution
  };
}

function calculateUploadDistribution(photos: Pick<Photo, "created_at">[]): { hour: number; count: number }[] {
  const distribution = new Map<number, number>();
  
  for (let i = 0; i < 24; i++) {
    distribution.set(i, 0);
  }
  
  photos.forEach(photo => {
    const hour = new Date(photo.created_at).getHours();
    distribution.set(hour, (distribution.get(hour) || 0) + 1);
  });
  
  return Array.from(distribution.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

export async function incrementDownloadCount(photoId: string) {
  const supabase = await createClient();
  
  const { data: photo } = await supabase
    .from("photos")
    .select("download_count")
    .eq("id", photoId)
    .single();
  
  if (photo) {
    await supabase
      .from("photos")
      .update({ download_count: (photo.download_count || 0) + 1 })
      .eq("id", photoId);
  }
}

export async function trackViewerPresence(eventId: string, userId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  
  const { data: existing } = await supabase
    .from("event_viewers")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();
  
  if (existing) {
    await supabase
      .from("event_viewers")
      .update({ last_seen_at: now })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("event_viewers")
      .insert({ event_id: eventId, user_id: userId, last_seen_at: now });
  }
}

export async function removeViewerPresence(eventId: string, userId: string) {
  const supabase = await createClient();
  
  await supabase
    .from("event_viewers")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
}
