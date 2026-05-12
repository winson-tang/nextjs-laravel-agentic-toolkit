/**
 * Demo logger that redacts PHI before emit. Wraps console; in a real
 * Sycle service this would feed a structured logger (pino/winston).
 *
 * Hard rule: never call console.log/error directly elsewhere.
 * Always go through this module so the redactor runs.
 */

import { redactValue } from "./redact";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, context?: unknown) {
  const safeMessage = redactValue(message);
  const safeContext = context === undefined ? undefined : redactValue(context);
  const payload = {
    ts: new Date().toISOString(),
    level,
    message: safeMessage,
    ...(safeContext ? { context: safeContext } : {}),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export const logger = {
  debug: (msg: string, ctx?: unknown) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: unknown) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: unknown) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: unknown) => emit("error", msg, ctx),
};
