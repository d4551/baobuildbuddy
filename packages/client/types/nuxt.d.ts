import type { QueryClient } from "@tanstack/vue-query";
import type { EdenApiNamespace } from "~/plugins/eden";

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
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
