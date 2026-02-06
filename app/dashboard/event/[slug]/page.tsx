import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ArrowLeft, ExternalLink, Tv, QrCode } from "lucide-react";
import { QRCodeDisplay } from "./qr-code-display";
import { PhotoGrid } from "./photo-grid";
import { CopyButton } from "./copy-button";
import { DownloadQRButton } from "./download-qr-button";
import type { Event, Photo } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventManagePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("host_id", user.id)
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  const { data: photosData } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const photos = (photosData || []) as Photo[];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const guestUrl = `${appUrl}/e/${event.slug}`;
  const liveUrl = `${appUrl}/live/${event.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                <Camera className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">{event.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* QR Code and Links */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Share with Guests
                </CardTitle>
                <CardDescription>
                  Guests scan this code to join and upload photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <QRCodeDisplay url={guestUrl} />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guest URL</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-secondary p-2 rounded truncate">
                      {guestUrl}
                    </code>
                    <CopyButton text={guestUrl} />
                    <DownloadQRButton url={guestUrl} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="h-5 w-5" />
                  Projector View
                </CardTitle>
                <CardDescription>
                  Open this on your big screen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href={liveUrl} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Live View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Photos Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Photos ({photos?.length || 0})</CardTitle>
                <CardDescription>
                  Click on a photo to hide it from the live view
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoGrid 
                  photos={photos} 
                  eventId={event.id}
                  eventSlug={event.slug}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
