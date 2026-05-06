#!/usr/bin/env node

import { parseArgs, getBooleanFlag } from "./core/args";
import { loadCliEnv } from "./core/env";
import { CliError, toCliError } from "./core/errors";
import { printError, printSuccess } from "./core/output";
import { createAdminClient } from "./core/supabase-admin";
import { handleDoctorCommand } from "./commands/doctor";
import { handleEventsCommand } from "./commands/events";
import { handleExportCommand } from "./commands/export";
import { handlePhotosCommand } from "./commands/photos";

const HELP = `LiveDrop CLI

Usage:
  pnpm cli doctor [--json]
  pnpm cli events list [--limit 50] [--json]
  pnpm cli events get <slug-or-id> [--json]
  pnpm cli events create --name <name> --host-id <uuid> [--slug <slug>] [--dry-run] [--json]
  pnpm cli events set-active <slug-or-id> <true|false> [--dry-run] [--json]
  pnpm cli events set-mode <slug-or-id> <live|kickoff> [--dry-run] [--json]
  pnpm cli photos list --event <slug-or-id> [--visible true|false] [--limit 100] [--json]
  pnpm cli photos hide <photo-id> [--dry-run] [--json]
  pnpm cli photos show <photo-id> [--dry-run] [--json]
  pnpm cli photos delete <photo-id> (--yes|--dry-run) [--json]
  pnpm cli export event <slug-or-id> [--json]

Agent flags:
  --json       Print structured JSON envelopes.
  --dry-run    Preview writes without changing data.
`;

async function main(): Promise<void> {
  loadCliEnv();

  const { command, positionals, flags } = parseArgs(process.argv.slice(2));
  const outputOptions = { json: getBooleanFlag(flags, "json") };
  const [namespace, subcommand] = command;

  if (!namespace || namespace === "help" || namespace === "--help") {
    printSuccess(HELP, outputOptions);
    return;
  }

  let data: unknown;

  switch (namespace) {
    case "doctor":
      data = await handleDoctorCommand();
      break;

    case "events": {
      const supabase = createAdminClient();
      data = await handleEventsCommand(supabase, subcommand, positionals, flags);
      break;
    }

    case "photos": {
      const supabase = createAdminClient();
      data = await handlePhotosCommand(supabase, subcommand, positionals, flags);
      break;
    }

    case "export": {
      const supabase = createAdminClient();
      data = await handleExportCommand(supabase, subcommand, positionals);
      break;
    }

    default:
      throw new CliError("BAD_REQUEST", "Unknown command", { command: namespace }, 2);
  }

  printSuccess(data, outputOptions);
}

main().catch((error) => {
  const parsed = parseArgs(process.argv.slice(2));
  const cliError = toCliError(error);
  printError(cliError, { json: getBooleanFlag(parsed.flags, "json") });
  process.exitCode = cliError.exitCode;
});
