"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackViewerPresence, removeViewerPresence } from "@/lib/supabase/statistics";

export function useViewerTracking(eventId: string) {
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);

  const trackPresence = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        await trackViewerPresence(eventId, user.id);
      }
    } catch (error) {
      console.error("Error tracking viewer presence:", error);
    }
  }, [eventId, supabase]);

  const cleanup = useCallback(async () => {
    if (userIdRef.current) {
      try {
        await removeViewerPresence(eventId, userIdRef.current);
      } catch (error) {
        console.error("Error removing viewer presence:", error);
      }
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [eventId]);

  useEffect(() => {
    trackPresence();
    
    intervalRef.current = setInterval(trackPresence, 60000);

    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cleanup();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [trackPresence, cleanup]);

  return { trackPresence, cleanup };
}
