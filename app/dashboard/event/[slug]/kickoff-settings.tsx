"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Rocket, TimerReset, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trackKickoffEvent } from "@/lib/analytics/kickoff";
import { setDisplayMode, updateKickoffConfig } from "@/lib/supabase/kickoff-actions";
import type { DisplayMode, KickoffConfig } from "@/lib/supabase/kickoff";

interface KickoffSettingsProps {
  eventId: string;
  initialMode: DisplayMode;
  initialConfig: KickoffConfig;
  canEdit: boolean;
}

interface FormState {
  enabled: boolean;
  title: string;
  subtitle: string;
  countdown_end_at: string;
  auto_switch: boolean;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toKickoffForm(config: KickoffConfig): FormState {
  return {
    enabled: config.enabled,
    title: config.title,
    subtitle: config.subtitle,
    countdown_end_at: toDatetimeLocal(config.countdown_end_at),
    auto_switch: config.auto_switch,
  };
}

export function KickoffSettings({ eventId, initialMode, initialConfig, canEdit }: KickoffSettingsProps) {
  const t = useTranslations("event.kickoff");
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toKickoffForm(initialConfig));
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(initialMode);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const hasCountdown = useMemo(() => form.countdown_end_at.length > 0, [form.countdown_end_at]);

  const handleSave = () => {
    setError("");

    startTransition(async () => {
      const result = await updateKickoffConfig(eventId, {
        enabled: form.enabled,
        title: form.title,
        subtitle: form.subtitle,
        countdown_end_at: form.countdown_end_at || null,
        auto_switch: form.auto_switch,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (form.enabled) {
        trackKickoffEvent("kickoff_enabled", {
          eventId,
          autoSwitch: form.auto_switch,
          hasCountdown,
        });
      }

      router.refresh();
    });
  };

  const handleModeChange = (mode: DisplayMode) => {
    if (mode === displayMode) return;

    setError("");
    startTransition(async () => {
      const result = await setDisplayMode(eventId, mode);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (mode === "live") {
        trackKickoffEvent("kickoff_switch_to_live_manual", { eventId, source: "dashboard" });
      }

      setDisplayModeState(mode);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="kickoff-enabled">{t("enabled")}</Label>
            <button
              id="kickoff-enabled"
              type="button"
              role="switch"
              aria-checked={form.enabled}
              disabled={!canEdit || isPending}
              onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                form.enabled ? "bg-primary" : "bg-muted",
                (!canEdit || isPending) && "cursor-not-allowed opacity-60"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                  form.enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{t("enabledHint")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kickoff-title">{t("mainTitle")}</Label>
            <Input
              id="kickoff-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={t("mainTitlePlaceholder")}
              disabled={!canEdit || isPending}
              maxLength={80}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kickoff-subtitle">{t("subtitle")}</Label>
            <Input
              id="kickoff-subtitle"
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              placeholder={t("subtitlePlaceholder")}
              disabled={!canEdit || isPending}
              maxLength={140}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kickoff-countdown">{t("countdownEndAt")}</Label>
            <Input
              id="kickoff-countdown"
              type="datetime-local"
              value={form.countdown_end_at}
              onChange={(event) => setForm((prev) => ({ ...prev, countdown_end_at: event.target.value }))}
              disabled={!canEdit || isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kickoff-auto-switch">{t("autoSwitch")}</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3">
              <input
                id="kickoff-auto-switch"
                type="checkbox"
                checked={form.auto_switch}
                onChange={(event) => setForm((prev) => ({ ...prev, auto_switch: event.target.checked }))}
                disabled={!canEdit || isPending}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">{t("autoSwitchHint")}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant={displayMode === "kickoff" ? "default" : "secondary"}
            disabled={!canEdit || isPending}
            onClick={() => handleModeChange("kickoff")}
          >
            <TimerReset className="mr-2 h-4 w-4" />
            {t("switchToKickoff")}
          </Button>
          <Button
            type="button"
            variant={displayMode === "live" ? "default" : "secondary"}
            disabled={!canEdit || isPending}
            onClick={() => handleModeChange("live")}
          >
            <Tv className="mr-2 h-4 w-4" />
            {t("startLive")}
          </Button>
          <Button type="button" disabled={!canEdit || isPending} onClick={handleSave}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("save")}
          </Button>
        </div>

        {!canEdit ? <p className="text-sm text-muted-foreground">{t("readOnlyHint")}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
