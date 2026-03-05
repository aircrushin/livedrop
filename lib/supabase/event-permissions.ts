import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type EventRole = "owner" | "manager" | "moderator" | "viewer";

export function canEditKickoff(role: EventRole | null): boolean {
  return role === "owner" || role === "manager";
}

export async function getUserEventRole(
  supabase: SupabaseClient<Database>,
  eventId: string,
  userId: string,
  hostId?: string
): Promise<EventRole | null> {
  if (hostId && hostId === userId) {
    return "owner";
  }

  const { data: member } = await supabase
    .from("event_members")
    .select("role")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member?.role) {
    return null;
  }

  if (member.role === "manager" || member.role === "moderator" || member.role === "viewer") {
    return member.role;
  }

  return null;
}
