import type { ToastApi, ToastOptions } from "~/composables/useToast";

const createNoopToast = (): ToastApi => {
  const noOp = (_message: string, _options?: ToastOptions): string => "";

  return {
    success: noOp,
    error: noOp,
    info: noOp,
    warning: noOp,
  };
};

/**
 * Provide a server-safe `$toast` contract during SSR and static prerender.
 */
export default defineNuxtPlugin(() => ({
  provide: {
    toast: createNoopToast(),
  },
}));
