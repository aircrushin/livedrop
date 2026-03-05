"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setEventActiveStatus } from "@/lib/supabase/event-actions";

interface EventStatusToggleProps {
  eventId: string;
  isActive: boolean;
}

export function EventStatusToggle({ eventId, isActive }: EventStatusToggleProps) {
  const t = useTranslations("event");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    setError("");
    startTransition(async () => {
      const result = await setEventActiveStatus(eventId, !isActive);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={isActive ? "destructive" : "default"}
        className="w-full"
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isActive ? (
          <PauseCircle className="h-4 w-4 mr-2" />
        ) : (
          <PlayCircle className="h-4 w-4 mr-2" />
        )}
        {isPending
          ? isActive
            ? t("deactivatingEvent")
            : t("activatingEvent")
          : isActive
            ? t("deactivateEvent")
            : t("activateEvent")}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
