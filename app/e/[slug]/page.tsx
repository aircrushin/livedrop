import { createClient } from "@/lib/supabase/server";
import { EventUnavailableState } from "@/components/event-unavailable-state";
import { CameraView } from "./camera-view";
import type { Event } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GuestEventPage({ params }: Props) {
  const { slug } = await params;
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

  return <CameraView event={event} />;
}
