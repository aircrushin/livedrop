"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ExternalLink, Edit2, Trash2, MoreVertical } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import { CreateEventModal } from "./create-event-modal";
import { RenameEventModal } from "./rename-event-modal";
import { DeleteEventModal } from "./delete-event-modal";
import type { Event } from "@/lib/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardClientProps {
  events: Event[];
  userEmail: string | undefined;
}

export function DashboardClient({ events, userEmail }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [renameEvent, setRenameEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

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
                {userEmail}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <CreateEventModal />
        </div>

        {events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate" title={event.name}>
                        {event.name}
                      </CardTitle>
                      <CardDescription>
                        {t('created')} {formatDate(event.created_at)}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRenameEvent(event)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          {t('rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteEvent(event)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {tCommon('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t('code')}</span>{" "}
                    <code className="bg-secondary px-2 py-0.5 rounded">{event.slug}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full flex-1" size="sm" asChild>
                      <Link href={`/dashboard/event/${event.slug}`}>{t('manage')}</Link>
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
              <CardTitle>{t('noEvents')}</CardTitle>
              <CardDescription>
                {t('noEventsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateEventModal />
            </CardContent>
          </Card>
        )}
      </main>

      {renameEvent && (
        <RenameEventModal
          eventId={renameEvent.id}
          currentName={renameEvent.name}
          onClose={() => setRenameEvent(null)}
        />
      )}

      {deleteEvent && (
        <DeleteEventModal
          eventId={deleteEvent.id}
          eventName={deleteEvent.name}
          onClose={() => setDeleteEvent(null)}
        />
      )}
    </div>
  );
}
