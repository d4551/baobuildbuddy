import { STATE_KEYS } from "@bao/shared";

const DEFAULT_TOAST_DURATION_MS = 5_000;
const ERROR_TOAST_DURATION_MS = 8_000;

const toastTypeTitles = {
  success: "Success",
  error: "Error",
  info: "Info",
  warning: "Warning",
} as const;

let toastSequence = 0;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Supported toast semantic types.
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Reactive toast item rendered by `ToastContainer`.
 */
export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs: number;
};

/**
 * Toast override options for title and visibility duration.
 */
export type ToastOptions = {
  title?: string;
  durationMs?: number;
};

/**
 * Public toast API exposed through `$toast`.
 */
export type ToastApi = {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
};

function getToastDuration(type: ToastType, durationOverride?: number): number {
  if (
    typeof durationOverride === "number" &&
    Number.isFinite(durationOverride) &&
    durationOverride >= 0
  ) {
    return durationOverride;
  }
  return type === "error" ? ERROR_TOAST_DURATION_MS : DEFAULT_TOAST_DURATION_MS;
}

function createToastId(): string {
  toastSequence += 1;
  return `toast-${toastSequence}`;
}

function clearToastTimeout(toastId: string): void {
  const timeout = toastTimeouts.get(toastId);
  if (!timeout) {
    return;
  }
  clearTimeout(timeout);
  toastTimeouts.delete(toastId);
}

/**
 * Centralized reactive toast store used by the global `$toast` plugin.
 */
export function useToast() {
  const toasts = useState<ToastItem[]>(STATE_KEYS.UI_TOASTS, () => []);

  function removeToast(toastId: string): void {
    clearToastTimeout(toastId);
    toasts.value = toasts.value.filter((toast) => toast.id !== toastId);
  }

  function clearToasts(): void {
    for (const toast of toasts.value) {
      clearToastTimeout(toast.id);
    }
    toasts.value = [];
  }

  function pushToast(message: string, type: ToastType, options: ToastOptions = {}): string {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return "";
    }

    const toastId = createToastId();
    const durationMs = getToastDuration(type, options.durationMs);

    toasts.value = [
      ...toasts.value,
      {
        id: toastId,
        type,
        title: options.title || toastTypeTitles[type],
        message: normalizedMessage,
        durationMs,
      },
    ];

    if (import.meta.client && durationMs > 0) {
      const timeout = setTimeout(() => {
        removeToast(toastId);
      }, durationMs);
      toastTimeouts.set(toastId, timeout);
    }

    return toastId;
  }

  const toastApi: ToastApi = {
    success: (message, options) => pushToast(message, "success", options),
    error: (message, options) => pushToast(message, "error", options),
    info: (message, options) => pushToast(message, "info", options),
    warning: (message, options) => pushToast(message, "warning", options),
  };

  return {
    toasts: readonly(toasts),
    pushToast,
    removeToast,
    clearToasts,
    ...toastApi,
  };
}
