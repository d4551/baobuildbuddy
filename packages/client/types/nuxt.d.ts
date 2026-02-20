import type { QueryClient } from "@tanstack/vue-query";
import type { EdenApiNamespace } from "~/plugins/eden";

interface ToastApi {
  success: (message: string, options?: { title?: string; durationMs?: number }) => string;
  error: (message: string, options?: { title?: string; durationMs?: number }) => string;
  info: (message: string, options?: { title?: string; durationMs?: number }) => string;
  warning: (message: string, options?: { title?: string; durationMs?: number }) => string;
}

declare module "#app" {
  interface NuxtApp {
    $api: EdenApiNamespace;
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $api: EdenApiNamespace;
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}
