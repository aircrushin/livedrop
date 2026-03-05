import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EventUnavailableState } from "@/components/event-unavailable-state";
import { normalizeKickoffConfig, shouldAutoSwitchToLive } from "@/lib/supabase/kickoff";
import { getKickoffMetrics } from "@/lib/supabase/kickoff-actions";
import { LiveDisplay } from "./live-display";
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
    .select("id, name, slug, host_id, is_active, display_mode, kickoff_config, branding")
    .eq("slug", slug)
    .single();

  const event = eventData as Pick<
    Event,
    "id" | "name" | "slug" | "host_id" | "is_active" | "display_mode" | "kickoff_config" | "branding"
  > | null;

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

  const kickoffConfig = normalizeKickoffConfig(event.kickoff_config);
  const initialMode =
    kickoffConfig.enabled && !shouldAutoSwitchToLive(kickoffConfig)
      ? event.display_mode
      : "live";
  const metricsResult = await getKickoffMetrics(event.id);
  const initialMetrics = "error" in metricsResult ? null : metricsResult;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const guestUrl = `${appUrl}/e/${event.slug}?src=kickoff`;
  const branding = (event.branding as {
    logoUrl?: string | null;
    primaryColor?: string;
    backgroundColor?: string;
  }) || { logoUrl: null, primaryColor: "#000000", backgroundColor: "#ffffff" };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LiveDisplay
        event={event}
        initialPhotos={initialPhotos}
        initialMode={initialMode}
        kickoffConfig={kickoffConfig}
        guestUrl={guestUrl}
        branding={{
          logoUrl: branding.logoUrl || null,
          primaryColor: branding.primaryColor || "#000000",
          backgroundColor: branding.backgroundColor || "#ffffff",
        }}
        initialMetrics={initialMetrics}
      />
    </NextIntlClientProvider>
  );
}
