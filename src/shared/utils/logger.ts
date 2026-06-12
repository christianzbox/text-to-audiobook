type LogLevel = "debug" | "info" | "warn" | "error";

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]+/g,
  /[A-Za-z0-9_-]{32,}/g
];

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return SECRET_PATTERNS.reduce((result, pattern) => result.replace(pattern, "[redacted]"), value);
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key.toLowerCase().includes("key") ? key : key,
        key.toLowerCase().includes("key") ? "[redacted]" : redact(entry)
      ])
    );
  }
  return value;
}

function write(level: LogLevel, message: string, context?: unknown): void {
  const args = context === undefined ? [`[PageVoice] ${message}`] : [`[PageVoice] ${message}`, redact(context)];
  console[level](...args);
}

export const logger = {
  debug: (message: string, context?: unknown) => write("debug", message, context),
  info: (message: string, context?: unknown) => write("info", message, context),
  warn: (message: string, context?: unknown) => write("warn", message, context),
  error: (message: string, context?: unknown) => write("error", message, context)
};
