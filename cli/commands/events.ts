import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../lib/supabase/types";
import { generateSlug } from "../../lib/utils";
import {
  getBooleanFlag,
  getStringFlag,
  requirePositional,
  requireStringFlag,
} from "../core/args";
import { CliError } from "../core/errors";
import { getAppUrl } from "../core/env";

type AdminClient = SupabaseClient<Database>;
type EventRow = Database["public"]["Tables"]["events"]["Row"];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function eventUrls(slug: string) {
  const appUrl = getAppUrl().replace(/\/$/, "");

  return {
    guest: `${appUrl}/e/${slug}`,
    live: `${appUrl}/live/${slug}`,
    dashboard: `${appUrl}/dashboard/event/${slug}`,
  };
}

export async function getEventByTarget(
  supabase: AdminClient,
  target: string
): Promise<EventRow> {
  const query = supabase.from("events").select("*");
  const response = isUuid(target)
    ? await query.eq("id", target).maybeSingle()
    : await query.eq("slug", target).maybeSingle();

  if (response.error) {
    throw new CliError("COMMAND_FAILED", response.error.message, { target });
  }

  if (!response.data) {
    throw new CliError("EVENT_NOT_FOUND", "Event not found", { target });
  }

  return response.data as EventRow;
}

async function eventSummary(supabase: AdminClient, event: EventRow) {
  const [photos, visiblePhotos, viewers] = await Promise.all([
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("event_id", event.id),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("is_visible", true),
    supabase
      .from("event_viewers")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id),
  ]);

  return {
    ...event,
    urls: eventUrls(event.slug),
    counts: {
      photos: photos.count ?? 0,
      visible_photos: visiblePhotos.count ?? 0,
      viewers: viewers.count ?? 0,
    },
  };
}

export async function handleEventsCommand(
  supabase: AdminClient,
  subcommand: string | undefined,
  positionals: string[],
  flags: Record<string, string | boolean>
) {
  switch (subcommand) {
    case "list": {
      const limit = Number(getStringFlag(flags, "limit") ?? "50");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message);
      }

      return (data as EventRow[]).map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        is_active: event.is_active,
        display_mode: event.display_mode,
        created_at: event.created_at,
        urls: eventUrls(event.slug),
      }));
    }

    case "get": {
      const event = await getEventByTarget(
        supabase,
        requirePositional(positionals, 0, "slug-or-id")
      );
      return eventSummary(supabase, event);
    }

    case "create": {
      const name = requireStringFlag(flags, "name");
      const hostId = requireStringFlag(flags, "host-id");
      const slug = getStringFlag(flags, "slug") ?? generateSlug(name);
      const dryRun = getBooleanFlag(flags, "dry-run");
      const payload: Database["public"]["Tables"]["events"]["Insert"] = {
        name,
        slug,
        host_id: hostId,
      };

      if (dryRun) {
        return { dry_run: true, insert: payload, urls: eventUrls(slug) };
      }

      const { data, error } = await supabase.from("events").insert(payload).select("*").single();

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { slug, host_id: hostId });
      }

      return eventSummary(supabase, data as EventRow);
    }

    case "set-active": {
      const target = requirePositional(positionals, 0, "slug-or-id");
      const value = requirePositional(positionals, 1, "true|false");
      const isActive = value === "true" ? true : value === "false" ? false : undefined;

      if (isActive === undefined) {
        throw new CliError("BAD_REQUEST", "Active value must be true or false", { value }, 2);
      }

      const event = await getEventByTarget(supabase, target);
      const dryRun = getBooleanFlag(flags, "dry-run");

      if (dryRun) {
        return { dry_run: true, event_id: event.id, slug: event.slug, is_active: isActive };
      }

      const { data, error } = await supabase
        .from("events")
        .update({ is_active: isActive })
        .eq("id", event.id)
        .select("*")
        .single();

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { target });
      }

      return eventSummary(supabase, data as EventRow);
    }

    case "set-mode": {
      const target = requirePositional(positionals, 0, "slug-or-id");
      const mode = requirePositional(positionals, 1, "live|kickoff");

      if (mode !== "live" && mode !== "kickoff") {
        throw new CliError("BAD_REQUEST", "Display mode must be live or kickoff", { mode }, 2);
      }

      const event = await getEventByTarget(supabase, target);
      const dryRun = getBooleanFlag(flags, "dry-run");

      if (dryRun) {
        return { dry_run: true, event_id: event.id, slug: event.slug, display_mode: mode };
      }

      const { data, error } = await supabase
        .from("events")
        .update({ display_mode: mode, display_mode_updated_at: new Date().toISOString() })
        .eq("id", event.id)
        .select("*")
        .single();

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { target });
      }

      return eventSummary(supabase, data as EventRow);
    }

    default:
      throw new CliError("BAD_REQUEST", "Unknown events command", { subcommand }, 2);
  }
}
