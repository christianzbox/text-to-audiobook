export class PageVoiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable = true
  ) {
    super(message);
    this.name = "PageVoiceError";
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof PageVoiceError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}
