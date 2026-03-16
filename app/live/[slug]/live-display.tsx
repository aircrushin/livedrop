"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import { QrCode, Users, WifiOff, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackKickoffEvent } from "@/lib/analytics/kickoff";
import { createClient } from "@/lib/supabase/client";
import { getKickoffMetrics } from "@/lib/supabase/kickoff-actions";
import { normalizeKickoffConfig, shouldAutoSwitchToLive } from "@/lib/supabase/kickoff";
import type { DisplayMode, KickoffConfig, KickoffMetrics } from "@/lib/supabase/kickoff";
import type { Event, Json } from "@/lib/supabase/types";
import { LiveGallery } from "./live-gallery";
import type { PhotoWithLikes } from "./page";

interface BrandingView {
  logoUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
}

interface LiveDisplayProps {
  event: Pick<Event, "id" | "name" | "slug">;
  initialPhotos: PhotoWithLikes[];
  initialMode: DisplayMode;
  kickoffConfig: KickoffConfig;
  guestUrl: string;
  branding: BrandingView;
  initialViewerCount: number;
  initialMetrics: KickoffMetrics | null;
}

function formatTimeLeft(targetIso: string | null, nowMs: number): string | null {
  if (!targetIso) return null;

  const diffMs = new Date(targetIso).getTime() - nowMs;
  if (Number.isNaN(diffMs)) return null;

  if (diffMs <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function LiveDisplay({
  event,
  initialPhotos,
  initialMode,
  kickoffConfig,
  guestUrl,
  branding,
  initialViewerCount,
  initialMetrics,
}: LiveDisplayProps) {
  const t = useTranslations("live.kickoff");
  const supabase = createClient();
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(initialMode);
  const [currentKickoffConfig, setCurrentKickoffConfig] = useState<KickoffConfig>(kickoffConfig);
  const [metrics, setMetrics] = useState<KickoffMetrics | null>(initialMetrics);
  const [metricsError, setMetricsError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const autoTrackedRef = useRef(false);

  const countdownText = useMemo(
    () => formatTimeLeft(currentKickoffConfig.countdown_end_at, nowMs),
    [currentKickoffConfig.countdown_end_at, nowMs]
  );

  useEffect(() => {
    if (displayMode !== "kickoff") return;

    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [displayMode]);

  useEffect(() => {
    if (displayMode !== "kickoff") return;

    trackKickoffEvent("kickoff_screen_viewed", { eventId: event.id });
  }, [displayMode, event.id]);

  const refreshMetrics = useCallback(async () => {
    const result = await getKickoffMetrics(event.id);

    if ("error" in result) {
      setMetricsError(true);
      return;
    }

    setMetricsError(false);
    setMetrics(result);
  }, [event.id]);

  useEffect(() => {
    if (displayMode !== "kickoff") return;

    const timer = setInterval(() => {
      void refreshMetrics();
    }, 8000);

    return () => clearInterval(timer);
  }, [displayMode, refreshMetrics]);

  useEffect(() => {
    const channel = supabase
      .channel(`display-mode:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${event.id}`,
        },
        (payload: { new: { display_mode?: DisplayMode; kickoff_config?: Json | null } }) => {
          if (payload.new?.display_mode === "kickoff" || payload.new?.display_mode === "live") {
            setDisplayModeState(payload.new.display_mode);
          }

          if (payload.new?.kickoff_config) {
            const normalized = normalizeKickoffConfig(payload.new.kickoff_config);
            setCurrentKickoffConfig(normalized);
            if (!normalized.enabled || shouldAutoSwitchToLive(normalized)) {
              setDisplayModeState("live");
            }
          }
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, supabase]);

  useEffect(() => {
    if (displayMode !== "kickoff") {
      autoTrackedRef.current = false;
      return;
    }

    if (!shouldAutoSwitchToLive(currentKickoffConfig, nowMs)) {
      return;
    }

    const timer = setTimeout(() => {
      setDisplayModeState("live");
    }, 0);

    if (!autoTrackedRef.current) {
      trackKickoffEvent("kickoff_switch_to_live_auto", {
        eventId: event.id,
        source: "countdown",
      });
      autoTrackedRef.current = true;
    }

    return () => clearTimeout(timer);
  }, [currentKickoffConfig, displayMode, event.id, nowMs]);

  if (displayMode === "live") {
    return <LiveGallery event={event} initialPhotos={initialPhotos} initialViewerCount={initialViewerCount} />;
  }

  const title = currentKickoffConfig.title || event.name;
  const subtitle = currentKickoffConfig.subtitle || t("defaultSubtitle");

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `radial-gradient(circle at 12% 18%, ${branding.primaryColor}44 0%, transparent 42%), linear-gradient(140deg, #05070d 0%, #0e1322 56%, #04050a 100%)`,
      }}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <Image src={branding.logoUrl} alt={event.name} width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <Zap className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">LiveDrop</p>
                <h1 className="text-xl font-semibold">{event.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">
              {isConnected ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : <WifiOff className="h-4 w-4" />}
              <span>{isConnected ? t("connected") : t("connecting")}</span>
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/70">{t("kicker")}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight lg:text-6xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-white/15 bg-white/8 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white/70">{t("step1Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">{t("step1Desc")}</CardContent>
            </Card>
            <Card className="border-white/15 bg-white/8 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white/70">{t("step2Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">{t("step2Desc")}</CardContent>
            </Card>
            <Card className="border-white/15 bg-white/8 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white/70">{t("step3Title")}</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">{t("step3Desc")}</CardContent>
            </Card>
          </div>

          <div className="flex items-end gap-4 rounded-2xl border border-white/10 bg-black/25 p-5">
            <div>
              <p className="text-sm text-white/70">{t("countdown")}</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums">{countdownText ?? t("comingSoon")}</p>
            </div>
            {currentKickoffConfig.countdown_end_at ? (
              <p className="pb-1 text-sm text-white/70">
                {t("targetTime", { time: new Date(currentKickoffConfig.countdown_end_at).toLocaleString() })}
              </p>
            ) : null}
          </div>

        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-white/15 bg-black/35 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-white/80">
              <QrCode className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.18em]">{t("scanTitle")}</span>
            </div>

            <a
              href={guestUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackKickoffEvent("kickoff_scan_qr", { eventId: event.id, source: "projector-link" })}
              className="block rounded-2xl bg-white p-5"
            >
              <QRCode value={guestUrl} size={300} level="H" fgColor={branding.primaryColor || "#111111"} bgColor={branding.backgroundColor || "#ffffff"} className="h-auto w-full" />
            </a>

            <p className="mt-4 break-all text-sm text-white/80">{guestUrl}</p>
          </div>

          {!metricsError && metrics ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-white/15 bg-white/8 text-white">
                <CardContent className="pt-5">
                  <p className="text-sm text-white/70">{t("joinedUsers")}</p>
                  <p className="mt-1 flex items-center gap-2 text-3xl font-semibold">
                    <Users className="h-5 w-5" />
                    {metrics.joiners}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/15 bg-white/8 text-white">
                <CardContent className="pt-5">
                  <p className="text-sm text-white/70">{t("uploadedPhotos")}</p>
                  <p className="mt-1 text-3xl font-semibold">{metrics.photos}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
