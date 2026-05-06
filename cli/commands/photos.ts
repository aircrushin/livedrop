import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../lib/supabase/types";
import { getBooleanFlag, getStringFlag, requirePositional } from "../core/args";
import { CliError } from "../core/errors";
import { deleteR2Object } from "../core/r2";
import { getEventByTarget } from "./events";

type AdminClient = SupabaseClient<Database>;
type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];

async function getPhotoById(supabase: AdminClient, photoId: string): Promise<PhotoRow> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();

  if (error) {
    throw new CliError("COMMAND_FAILED", error.message, { photo_id: photoId });
  }

  if (!data) {
    throw new CliError("PHOTO_NOT_FOUND", "Photo not found", { photo_id: photoId });
  }

  return data as PhotoRow;
}

function requireYesOrDryRun(flags: Record<string, string | boolean>): void {
  if (getBooleanFlag(flags, "yes") || getBooleanFlag(flags, "dry-run")) {
    return;
  }

  throw new CliError(
    "BAD_REQUEST",
    "This command is destructive. Pass --yes to run it or --dry-run to preview.",
    undefined,
    2
  );
}

export async function handlePhotosCommand(
  supabase: AdminClient,
  subcommand: string | undefined,
  positionals: string[],
  flags: Record<string, string | boolean>
) {
  switch (subcommand) {
    case "list": {
      const eventTarget = getStringFlag(flags, "event");

      if (!eventTarget) {
        throw new CliError("BAD_REQUEST", "Missing required flag: --event", { flag: "event" }, 2);
      }

      const event = await getEventByTarget(supabase, eventTarget);
      const limit = Number(getStringFlag(flags, "limit") ?? "100");
      const visible = getStringFlag(flags, "visible");
      let query = supabase
        .from("photos")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (visible === "true") {
        query = query.eq("is_visible", true);
      } else if (visible === "false") {
        query = query.eq("is_visible", false);
      }

      const { data, error } = await query;

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { event: eventTarget });
      }

      return {
        event: {
          id: event.id,
          slug: event.slug,
          name: event.name,
        },
        photos: data,
      };
    }

    case "hide":
    case "show": {
      const photoId = requirePositional(positionals, 0, "photo-id");
      const photo = await getPhotoById(supabase, photoId);
      const isVisible = subcommand === "show";
      const dryRun = getBooleanFlag(flags, "dry-run");

      if (dryRun) {
        return { dry_run: true, photo_id: photo.id, is_visible: isVisible };
      }

      const { data, error } = await supabase
        .from("photos")
        .update({ is_visible: isVisible })
        .eq("id", photo.id)
        .select("*")
        .single();

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { photo_id: photoId });
      }

      return data;
    }

    case "delete": {
      requireYesOrDryRun(flags);

      const photoId = requirePositional(positionals, 0, "photo-id");
      const photo = await getPhotoById(supabase, photoId);
      const dryRun = getBooleanFlag(flags, "dry-run");

      if (dryRun) {
        return {
          dry_run: true,
          delete: {
            r2_key: photo.storage_path,
            photo_id: photo.id,
          },
        };
      }

      await deleteR2Object(photo.storage_path);

      const { error } = await supabase.from("photos").delete().eq("id", photo.id);

      if (error) {
        throw new CliError("COMMAND_FAILED", error.message, { photo_id: photoId });
      }

      return {
        deleted: true,
        photo_id: photo.id,
        r2_key: photo.storage_path,
      };
    }

    default:
      throw new CliError("BAD_REQUEST", "Unknown photos command", { subcommand }, 2);
  }
}
