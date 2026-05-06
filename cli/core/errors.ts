export type ErrorCode =
  | "BAD_REQUEST"
  | "CONFIG_ERROR"
  | "EVENT_NOT_FOUND"
  | "PHOTO_NOT_FOUND"
  | "COMMAND_FAILED";

export class CliError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly exitCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    exitCode = 1
  ) {
    super(message);
    this.name = "CliError";
    this.code = code;
    this.details = details;
    this.exitCode = exitCode;
  }
}

export function toCliError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  if (error instanceof Error) {
    return new CliError("COMMAND_FAILED", error.message);
  }

  return new CliError("COMMAND_FAILED", "Command failed");
}
