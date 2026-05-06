import { readFileSync } from "node:fs";

import { CliError } from "./errors";

export interface ParsedArgs {
  command: string[];
  flags: Record<string, string | boolean>;
  positionals: string[];
}

function normalizeFlagName(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function parseArgs(argv: string[]): ParsedArgs {
  const command: string[] = [];
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];
  let parsingFlags = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--") {
      continue;
    }

    if (token.startsWith("--")) {
      parsingFlags = true;
      const [rawName, inlineValue] = token.slice(2).split("=", 2);
      const name = normalizeFlagName(rawName);

      if (inlineValue !== undefined) {
        flags[name] = inlineValue;
        continue;
      }

      const nextToken = argv[index + 1];

      if (nextToken && !nextToken.startsWith("--")) {
        flags[name] = nextToken;
        index += 1;
      } else {
        flags[name] = true;
      }

      continue;
    }

    if (parsingFlags || command.length >= 2) {
      positionals.push(token);
    } else {
      command.push(token);
    }
  }

  return { command, flags, positionals };
}

export function getStringFlag(
  flags: Record<string, string | boolean>,
  name: string
): string | undefined {
  const value = flags[normalizeFlagName(name)];

  if (value === undefined || typeof value === "boolean") {
    return undefined;
  }

  return value;
}

export function getBooleanFlag(flags: Record<string, string | boolean>, name: string): boolean {
  return flags[normalizeFlagName(name)] === true;
}

export function requireStringFlag(
  flags: Record<string, string | boolean>,
  name: string
): string {
  const value = getStringFlag(flags, name);

  if (!value) {
    throw new CliError("BAD_REQUEST", `Missing required flag: --${name}`, { flag: name }, 2);
  }

  return value;
}

export function requirePositional(positionals: string[], index: number, label: string): string {
  const value = positionals[index];

  if (!value) {
    throw new CliError("BAD_REQUEST", `Missing required argument: ${label}`, { label }, 2);
  }

  return value;
}

export function readJsonInput(
  flags: Record<string, string | boolean>
): unknown | undefined {
  const input = getStringFlag(flags, "input");

  if (!input) {
    return undefined;
  }

  const contents = input === "-" ? readFileSync(0, "utf8") : readFileSync(input, "utf8");
  return JSON.parse(contents) as unknown;
}
