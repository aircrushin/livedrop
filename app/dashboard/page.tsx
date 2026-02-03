import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Plus, ExternalLink, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import { CreateEventModal } from "./create-event-modal";
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Camera className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">LiveDrop</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Events</h1>
            <p className="text-muted-foreground">Manage your live photo events</p>
          </div>
          <CreateEventModal />
        </div>

        {events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{event.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(event.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Code:</span>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded">{event.slug}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full flex-1" size="sm" asChild>
                      <Link href={`/dashboard/event/${event.slug}`}>Manage</Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/live/${event.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-accent" />
              </div>
              <CardTitle>No events yet</CardTitle>
              <CardDescription>
                Create your first event and start collecting photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEventModal />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
