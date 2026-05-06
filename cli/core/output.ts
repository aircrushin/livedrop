import { CliError } from "./errors";

export interface OutputOptions {
  json: boolean;
}

export function printSuccess(data: unknown, options: OutputOptions): void {
  if (options.json) {
    console.log(JSON.stringify({ ok: true, data }, null, 2));
    return;
  }

  if (typeof data === "string") {
    console.log(data);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

export function printError(error: CliError, options: OutputOptions): void {
  if (options.json) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          code: error.code,
          message: error.message,
          details: error.details,
        },
        null,
        2
      )
    );
    return;
  }

  console.error(`${error.code}: ${error.message}`);

  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
}
