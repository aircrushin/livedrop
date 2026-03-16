"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackViewerPresence } from "@/lib/supabase/statistics";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateViewerSessionId() {
  try {
    const storageKey = "livedrop-viewer-session-id";
    const existing = sessionStorage.getItem(storageKey);

    if (existing) return existing;

    const next = createSessionId();
    sessionStorage.setItem(storageKey, next);
    return next;
  } catch {
    return createSessionId();
  }
}

export function useViewerTracking(eventId: string) {
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const trackPresence = useCallback(async () => {
    try {
      if (!sessionIdRef.current) {
        sessionIdRef.current = getOrCreateViewerSessionId();
      }

      const { data: { user } } = await supabase.auth.getUser();
      await trackViewerPresence(eventId, sessionIdRef.current, user?.id ?? null);
    } catch (error) {
      console.error("Error tracking viewer presence:", error);
    }
  }, [eventId, supabase]);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

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
