import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { EventUnavailableState } from "@/components/event-unavailable-state";
import { getLiveDateFilter } from "@/lib/live-date-filter";
import { normalizeKickoffConfig, shouldAutoSwitchToLive } from "@/lib/supabase/kickoff";
import { getKickoffMetrics } from "@/lib/supabase/kickoff-actions";
import { LiveDisplay } from "./live-display";
import type { Event, Photo } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}

export interface PhotoWithLikes extends Photo {
  likes_count: number;
  comments_count: number;
}

const LIVE_PHOTO_SELECT = `
  id,
  event_id,
  storage_path,
  created_at,
  is_visible,
  likes_count:photo_likes(count),
  comments_count:photo_comments(count)
`;

export default async function LiveViewPage({ params, searchParams }: Props) {
  const [{ slug }, { date }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const liveDateFilter = getLiveDateFilter(date);

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

  const kickoffConfig = normalizeKickoffConfig(event.kickoff_config);
  const initialMode =
    liveDateFilter
      ? "live"
      : kickoffConfig.enabled && !shouldAutoSwitchToLive(kickoffConfig)
      ? event.display_mode
      : "live";

  let photosQuery = supabase
    .from("photos")
    .select(LIVE_PHOTO_SELECT)
    .eq("event_id", event.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (liveDateFilter) {
    photosQuery = photosQuery
      .gte("created_at", liveDateFilter.startUtc)
      .lt("created_at", liveDateFilter.endUtc);
  }

  const [locale, messages, photosResult, viewerResult, metricsResult] = await Promise.all([
    getLocale(),
    getMessages(),
    photosQuery,
    supabase
      .from("event_viewers")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id),
    initialMode === "kickoff" ? getKickoffMetrics(event.id) : Promise.resolve(null),
  ]);

  const liveMessages = messages.live ? { live: messages.live } : messages;

  const initialPhotos = (photosResult.data || []).map((photo) => ({
    ...photo,
    likes_count: (photo as unknown as { likes_count: [{ count: number }] }).likes_count?.[0]?.count || 0,
    comments_count: (photo as unknown as { comments_count: [{ count: number }] }).comments_count?.[0]?.count || 0,
  })) as PhotoWithLikes[];

  const initialViewerCount = viewerResult.count || 0;
  const initialMetrics =
    metricsResult && !("error" in metricsResult) ? metricsResult : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const guestUrl = `${appUrl}/e/${event.slug}?src=kickoff`;
  const branding = (event.branding as {
    logoUrl?: string | null;
    primaryColor?: string;
    backgroundColor?: string;
  }) || { logoUrl: null, primaryColor: "#000000", backgroundColor: "#ffffff" };

  return (
    <NextIntlClientProvider locale={locale} messages={liveMessages}>
      <LiveDisplay
        event={event}
        initialPhotos={initialPhotos}
        initialMode={initialMode}
        kickoffConfig={kickoffConfig}
        guestUrl={guestUrl}
        liveDateFilter={liveDateFilter}
        forceLiveMode={Boolean(liveDateFilter)}
        branding={{
          logoUrl: branding.logoUrl || null,
          primaryColor: branding.primaryColor || "#000000",
          backgroundColor: branding.backgroundColor || "#ffffff",
        }}
        initialViewerCount={initialViewerCount}
        initialMetrics={initialMetrics}
      />
    </NextIntlClientProvider>
  );
}
