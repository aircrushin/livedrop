import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../lib/supabase/types";
import { CliError } from "../core/errors";
import { getEventByTarget, eventUrls } from "./events";

type AdminClient = SupabaseClient<Database>;
type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];

export async function handleExportCommand(
  supabase: AdminClient,
  subcommand: string | undefined,
  positionals: string[]
) {
  switch (subcommand) {
    case "event": {
      const target = positionals[0];

      if (!target) {
        throw new CliError("BAD_REQUEST", "Missing required argument: slug-or-id", undefined, 2);
      }

      const event = await getEventByTarget(supabase, target);
      const [photos, viewers, members] = await Promise.all([
        supabase
          .from("photos")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("event_viewers")
          .select("*")
          .eq("event_id", event.id)
          .order("last_seen_at", { ascending: false }),
        supabase
          .from("event_members")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false }),
      ]);

      for (const response of [photos, viewers, members]) {
        if (response.error) {
          throw new CliError("COMMAND_FAILED", response.error.message, { target });
        }
      }

      const photoRows = (photos.data ?? []) as PhotoRow[];

      return {
        event: {
          ...event,
          urls: eventUrls(event.slug),
        },
        photos: photoRows,
        viewers: viewers.data ?? [],
        members: members.data ?? [],
        counts: {
          photos: photoRows.length,
          visible_photos: photoRows.filter((photo) => photo.is_visible).length,
          hidden_photos: photoRows.filter((photo) => !photo.is_visible).length,
          viewers: viewers.data?.length ?? 0,
          members: members.data?.length ?? 0,
        },
      };
    }

    default:
      throw new CliError("BAD_REQUEST", "Unknown export command", { subcommand }, 2);
  }
}
