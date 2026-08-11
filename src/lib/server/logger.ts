import "server-only";

/**
 * Portable structured logger for Next server paths (ADR-006 / slice 3).
 * No vendor coupling — swap sink later without touching call sites.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

function emit(level: LogLevel, message: string, fields?: LogFields): void {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...(fields ?? {}),
  };
  const line = JSON.stringify(payload);
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) =>
    emit("debug", message, fields),
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) =>
    emit("error", message, fields),
};
