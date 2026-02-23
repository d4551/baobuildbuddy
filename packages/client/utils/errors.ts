const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toMessage = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return null;
};

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (error instanceof Error) {
    const message = toMessage(error.message);
    if (message) {
      return message;
    }
  }

  if (isRecord(error)) {
    const directMessage = toMessage(error.message);
    if (directMessage) {
      return directMessage;
    }

    const value = error.value;
    if (isRecord(value)) {
      const nestedMessage = toMessage(value.message);
      if (nestedMessage) {
        return nestedMessage;
      }
    }
  }

  return fallback;
}
