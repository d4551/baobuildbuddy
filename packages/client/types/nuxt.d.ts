import type { QueryClient } from "@tanstack/vue-query";

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

declare module "#app" {
  interface NuxtApp {
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $getStoredApiKey: () => string | null;
    $setStoredApiKey: (key: string | null) => void;
    $toast: ToastApi;
    $queryClient: QueryClient;
  }
}

export {};
