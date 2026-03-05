import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";
import type { Event } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const [hostedEventsResult, membershipsResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_members")
      .select("event_id")
      .eq("user_id", user.id)
      .in("role", ["manager", "moderator", "viewer"]),
  ]);

  const hostedEvents = (hostedEventsResult.data || []) as Event[];
  const memberEventIds = [...new Set((membershipsResult.data || []).map((item) => item.event_id))];
  let memberEvents: Event[] = [];

  if (memberEventIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("id", memberEventIds);

    memberEvents = (data || []) as Event[];
  }

  const eventsMap = new Map<string, Event>();
  for (const event of hostedEvents) eventsMap.set(event.id, event);
  for (const event of memberEvents) eventsMap.set(event.id, event);

  const events = Array.from(eventsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return <DashboardClient events={events} userEmail={user.email} />;
}
