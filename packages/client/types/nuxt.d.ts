import type { QueryClient } from "@tanstack/vue-query";
import type { ClientApi } from "~/types/client-api";

interface ToastApi {
  success: (message: string, options?: { title?: string; durationMs?: number }) => string;
  error: (message: string, options?: { title?: string; durationMs?: number }) => string;
  info: (message: string, options?: { title?: string; durationMs?: number }) => string;
  warning: (message: string, options?: { title?: string; durationMs?: number }) => string;
}

declare module "#app" {
  interface NuxtApp {
    $api: ClientApi;
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $api: ClientApi;
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}
