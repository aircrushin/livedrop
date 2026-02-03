import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveGallery } from "./live-gallery";
import type { Event, Photo } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LiveViewPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  const event = eventData as Pick<Event, "id" | "name" | "slug"> | null;

  if (!event) {
    notFound();
  }

  const { data: photosData } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", event.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  const initialPhotos = (photosData || []) as Photo[];

  return (
    <LiveGallery 
      event={event} 
      initialPhotos={initialPhotos} 
    />
  );
}
