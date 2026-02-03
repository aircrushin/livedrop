import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  const event = eventData as Pick<Event, "id" | "name" | "slug"> | null;

  if (!event) {
    notFound();
  }

  return <CameraView event={event} />;
}
