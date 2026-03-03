"use client";

import { LiveDropLogo } from "@/components/livedrop-logo";
import { Zap, ZapOff, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CameraHeaderProps {
  eventName: string;
  eventSlug: string;
  flash: boolean;
  onToggleFlash: () => void;
}

export function CameraHeader({ eventName, eventSlug, flash, onToggleFlash }: CameraHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
      <div className="flex items-center gap-2">
        <LiveDropLogo
          subtitle={eventName}
          labelClassName="text-white/60"
          subtitleClassName="text-white font-medium text-base"
          iconClassName="h-8 w-8 rounded-xl"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-white hover:bg-white/10"
        >
          <Link href={`/live/${eventSlug}`}>
            <MonitorPlay className="h-5 w-5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFlash}
          className="text-white hover:bg-white/10"
        >
          {flash ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
