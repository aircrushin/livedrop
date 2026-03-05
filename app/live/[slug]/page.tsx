import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EventUnavailableState } from "@/components/event-unavailable-state";
import { LiveGallery } from "./live-gallery";
import type { Event, Photo } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export interface PhotoWithLikes extends Photo {
  likes_count: number;
  comments_count: number;
}

export default async function LiveViewPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const messages = await getMessages();
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .single();

  const event = eventData as Pick<Event, "id" | "name" | "slug" | "is_active"> | null;

  if (!event) {
    return <EventUnavailableState reason="not_found" />;
  }

  if (!event.is_active) {
    return <EventUnavailableState reason="ended" />;
  }

  // Fetch photos with likes and comments count
  const { data: photosData } = await supabase
    .from("photos")
    .select(`
      *,
      likes_count:photo_likes(count),
      comments_count:photo_comments(count)
    `)
    .eq("event_id", event.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  const initialPhotos = (photosData || []).map((photo) => ({
    ...photo,
    likes_count: (photo as unknown as { likes_count: [{ count: number }] }).likes_count?.[0]?.count || 0,
    comments_count: (photo as unknown as { comments_count: [{ count: number }] }).comments_count?.[0]?.count || 0,
  })) as PhotoWithLikes[];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LiveGallery event={event} initialPhotos={initialPhotos} />
    </NextIntlClientProvider>
  );
}
