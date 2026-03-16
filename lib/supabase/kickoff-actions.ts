"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canEditKickoff, getUserEventRole } from "@/lib/supabase/event-permissions";
import {
  DEFAULT_KICKOFF_CONFIG,
  type DisplayMode,
  type KickoffConfig,
  type KickoffMetrics,
  normalizeKickoffConfig,
} from "@/lib/supabase/kickoff";
import type { Json } from "@/lib/supabase/types";

interface DisplayState {
  mode: DisplayMode;
  kickoffConfig: KickoffConfig;
  updatedAt: string | null;
}

interface ActionResult {
  error?: string;
  success?: boolean;
}

interface ModeActionResult extends ActionResult {
  mode?: DisplayMode;
  updatedAt?: string;
}

interface ConfigActionResult extends ActionResult {
  kickoffConfig?: KickoffConfig;
}

async function getEventForMutation(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" } as const;
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, slug, host_id, display_mode")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { error: "Event not found" } as const;
  }

  const role = await getUserEventRole(supabase, event.id, user.id, event.host_id);

  if (!canEditKickoff(role)) {
    return { error: "Unauthorized" } as const;
  }

  return { supabase, event } as const;
}

function sanitizeKickoffConfig(config: Partial<KickoffConfig>): KickoffConfig {
  const parsedCountdown = config.countdown_end_at ? new Date(config.countdown_end_at) : null;
  const countdownEndAt =
    parsedCountdown && !Number.isNaN(parsedCountdown.getTime()) ? parsedCountdown.toISOString() : null;

  return {
    enabled: Boolean(config.enabled),
    title: (config.title ?? "").toString().trim().slice(0, 80),
    subtitle: (config.subtitle ?? "").toString().trim().slice(0, 140),
    countdown_end_at: countdownEndAt,
    auto_switch: Boolean(config.auto_switch),
  };
}

export async function updateKickoffConfig(
  eventId: string,
  config: Partial<KickoffConfig>
): Promise<ConfigActionResult> {
  const mutationContext = await getEventForMutation(eventId);

  if ("error" in mutationContext) {
    return { error: mutationContext.error };
  }

  const { supabase, event } = mutationContext;
  const nextConfig = sanitizeKickoffConfig(config);

  const updates: {
    kickoff_config: Json;
    display_mode_updated_at: string;
    display_mode?: DisplayMode;
  } = {
    kickoff_config: JSON.parse(JSON.stringify(nextConfig)) as Json,
    display_mode_updated_at: new Date().toISOString(),
  };

  if (nextConfig.enabled && event.display_mode !== "kickoff") {
    updates.display_mode = "kickoff";
  } else if (!nextConfig.enabled && event.display_mode === "kickoff") {
    updates.display_mode = "live";
  }

  const { error } = await supabase.from("events").update(updates).eq("id", eventId);

  if (error) {
    console.error("Error updating kickoff config:", error);
    return { error: "Failed to update kickoff config" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/event/${event.slug}`);
  revalidatePath(`/live/${event.slug}`);

  return { success: true, kickoffConfig: nextConfig };
}

export async function setDisplayMode(
  eventId: string,
  mode: DisplayMode
): Promise<ModeActionResult> {
  if (mode !== "kickoff" && mode !== "live") {
    return { error: "Invalid mode" };
  }

  const mutationContext = await getEventForMutation(eventId);

  if ("error" in mutationContext) {
    return { error: mutationContext.error };
  }

  const { supabase, event } = mutationContext;
  const updatedAt = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update({
      display_mode: mode,
      display_mode_updated_at: updatedAt,
    })
    .eq("id", eventId);

  if (error) {
    console.error("Error updating display mode:", error);
    return { error: "Failed to update display mode" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/event/${event.slug}`);
  revalidatePath(`/live/${event.slug}`);

  return { success: true, mode, updatedAt };
}

export async function getDisplayState(eventId: string): Promise<DisplayState> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("display_mode, kickoff_config, display_mode_updated_at")
    .eq("id", eventId)
    .maybeSingle();

  if (!data) {
    return {
      mode: "live",
      kickoffConfig: { ...DEFAULT_KICKOFF_CONFIG },
      updatedAt: null,
    };
  }

  return {
    mode: (data.display_mode as DisplayMode) || "live",
    kickoffConfig: normalizeKickoffConfig(data.kickoff_config),
    updatedAt: data.display_mode_updated_at,
  };
}

export async function getKickoffMetrics(eventId: string): Promise<KickoffMetrics | { error: string }> {
  const supabase = await createClient();

  try {
    const [photosResult, joinersResult] = await Promise.all([
      supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId),
      supabase
        .from("event_viewers")
        .select("user_id, session_id")
        .eq("event_id", eventId),
    ]);

    if (photosResult.error || joinersResult.error) {
      return { error: "Failed to load metrics" };
    }

    const uniqueJoiners = new Set(
      (joinersResult.data || [])
        .map((viewer) => viewer.user_id || viewer.session_id)
        .filter(Boolean)
    );

    return {
      joiners: uniqueJoiners.size,
      photos: photosResult.count || 0,
    };
  } catch (error) {
    console.error("Error loading kickoff metrics:", error);
    return { error: "Failed to load metrics" };
  }
}
