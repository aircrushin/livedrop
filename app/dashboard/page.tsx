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

  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const events = (eventsData || []) as Event[];

  return <DashboardClient events={events} userEmail={user.email} />;
}
