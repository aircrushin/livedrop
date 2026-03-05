import type { Json } from "@/lib/supabase/types";

export type DisplayMode = "kickoff" | "live";

export interface KickoffConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  countdown_end_at: string | null;
  auto_switch: boolean;
}

export interface KickoffMetrics {
  joiners: number;
  photos: number;
}

export const DEFAULT_KICKOFF_CONFIG: KickoffConfig = {
  enabled: false,
  title: "",
  subtitle: "",
  countdown_end_at: null,
  auto_switch: false,
};

export function normalizeKickoffConfig(raw: Json | null | undefined): KickoffConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_KICKOFF_CONFIG };
  }

  const kickoff = raw as Record<string, Json>;

  return {
    enabled: typeof kickoff.enabled === "boolean" ? kickoff.enabled : DEFAULT_KICKOFF_CONFIG.enabled,
    title: typeof kickoff.title === "string" ? kickoff.title : DEFAULT_KICKOFF_CONFIG.title,
    subtitle: typeof kickoff.subtitle === "string" ? kickoff.subtitle : DEFAULT_KICKOFF_CONFIG.subtitle,
    countdown_end_at:
      typeof kickoff.countdown_end_at === "string" ? kickoff.countdown_end_at : DEFAULT_KICKOFF_CONFIG.countdown_end_at,
    auto_switch: typeof kickoff.auto_switch === "boolean" ? kickoff.auto_switch : DEFAULT_KICKOFF_CONFIG.auto_switch,
  };
}

export function parseEventKickoffConfig(event: { kickoff_config: Json | null }): KickoffConfig {
  return normalizeKickoffConfig(event.kickoff_config);
}

export function shouldAutoSwitchToLive(config: KickoffConfig, nowMs: number = Date.now()): boolean {
  if (!config.enabled || !config.auto_switch || !config.countdown_end_at) {
    return false;
  }

  const endMs = new Date(config.countdown_end_at).getTime();
  if (Number.isNaN(endMs)) {
    return false;
  }

  return endMs <= nowMs;
}
