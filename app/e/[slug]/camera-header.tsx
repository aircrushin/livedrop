"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("camera");

  return (
    <div className="bg-black/50 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <LiveDropLogo
            subtitle={eventName}
            labelClassName="text-white/60"
            subtitleClassName="text-white font-medium text-base"
            iconClassName="h-8 w-8 rounded-xl"
          />
          <p className="mt-2 max-w-[240px] text-xs text-white/65 sm:max-w-sm sm:text-sm">
            {t("headerHint")}
          </p>
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
    </div>
  );
}
