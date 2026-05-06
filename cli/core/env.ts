import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CliError } from "./errors";

const loadedKeys = new Set<string>();

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadEnvFile(path: string): void {
  if (!existsSync(path)) {
    return;
  }

  const values = parseEnvFile(readFileSync(path, "utf8"));

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined || loadedKeys.has(key)) {
      process.env[key] = value;
      loadedKeys.add(key);
    }
  }
}

export function loadCliEnv(cwd = process.cwd()): void {
  loadEnvFile(resolve(cwd, ".env"));
  loadEnvFile(resolve(cwd, ".env.local"));
}

export function getOptionalEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

export function requireEnv(key: string): string {
  const value = getOptionalEnv(key);

  if (!value) {
    throw new CliError("CONFIG_ERROR", `Missing required environment variable: ${key}`, {
      key,
    });
  }

  return value;
}

export function getAppUrl(): string {
  return getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
}
