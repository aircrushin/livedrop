import { track } from "@vercel/analytics";

export type KickoffTrackEvent =
  | "kickoff_enabled"
  | "kickoff_screen_viewed"
  | "kickoff_switch_to_live_manual"
  | "kickoff_switch_to_live_auto"
  | "kickoff_scan_qr"
  | "kickoff_first_upload_after_open";

export function trackKickoffEvent(name: KickoffTrackEvent, properties?: Record<string, string | number | boolean>) {
  track(name, properties);
}
