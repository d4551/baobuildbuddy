import { ref } from "vue";

type ClientLogLevel = "debug" | "info" | "warn" | "error";

type ClientLogger = {
  debug: (...values: unknown[]) => void;
  info: (...values: unknown[]) => void;
  warn: (...values: unknown[]) => void;
  error: (...values: unknown[]) => void;
};

const debugLogEnabled = ref(true);

/**
 * Create a client-side logger that avoids direct console output.
 */
export function createClientLogger(scope: string): ClientLogger {
  const emit = (level: ClientLogLevel, values: unknown[]) => {
    if (!import.meta.client || !debugLogEnabled.value) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("baobuildbuddy:diagnostic", {
        detail: {
          scope,
          level,
          values,
          timestamp: Date.now(),
        },
      }),
    );
  };

  return {
    debug: (...values: unknown[]) => {
      emit("debug", values);
    },
    info: (...values: unknown[]) => {
      emit("info", values);
    },
    warn: (...values: unknown[]) => {
      emit("warn", values);
    },
    error: (...values: unknown[]) => {
      emit("error", values);
    },
  };
}

