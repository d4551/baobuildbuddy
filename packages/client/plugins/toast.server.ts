import type { ToastApi, ToastOptions } from "~/composables/useToast";

const createNoopToast = (): ToastApi => {
  const noOp = (...args: [message: string, options?: ToastOptions]): string => {
    if (args.length > 2) {
      return "";
    }
    return "";
  };

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
