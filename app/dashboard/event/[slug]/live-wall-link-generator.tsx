"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChinaTodayDateInput, toLiveDateParam } from "@/lib/live-date-filter";
import { CopyButton } from "./copy-button";

interface LiveWallLinkGeneratorProps {
  liveUrl: string;
}

export function LiveWallLinkGenerator({ liveUrl }: LiveWallLinkGeneratorProps) {
  const t = useTranslations("event");
  const [dateInput, setDateInput] = useState(() => getChinaTodayDateInput());

  const generatedUrl = useMemo(() => {
    const dateParam = toLiveDateParam(dateInput);

    return dateParam ? `${liveUrl}?date=${dateParam}` : liveUrl;
  }, [dateInput, liveUrl]);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4" />
          <span>{t("datedLiveWallLink")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("datedLiveWallHint")}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="live-wall-date" className="text-sm font-medium">
            {t("liveWallDate")}
          </label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setDateInput(getChinaTodayDateInput())}
          >
            {t("todayLink")}
          </button>
        </div>
        <Input
          id="live-wall-date"
          type="date"
          value={dateInput}
          max={getChinaTodayDateInput()}
          onChange={(event) => setDateInput(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("generatedLiveWallLink")}</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-background px-3 py-2 text-xs">
            {generatedUrl}
          </code>
          <CopyButton text={generatedUrl} />
        </div>
      </div>

      <Button variant="outline" className="w-full" asChild>
        <Link href={generatedUrl} target="_blank">
          <ExternalLink className="mr-2 h-4 w-4" />
          {t("openDatedLiveWall")}
        </Link>
      </Button>
    </div>
  );
}
