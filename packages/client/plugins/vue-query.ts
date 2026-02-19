import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

const NON_NEGATIVE_MIN = 0;
const QUERY_STALE_TIME_FALLBACK_MS = 60_000;
const QUERY_RETRY_FALLBACK = 1;
const QUERY_REFOCUS_FALLBACK = true;

function toNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(NON_NEGATIVE_MIN, parsed);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

export default defineNuxtPlugin((nuxtApp) => {
  const { public: publicConfig } = useRuntimeConfig();
  const staleTime = toNonNegativeNumber(publicConfig.queryStaleTimeMs, QUERY_STALE_TIME_FALLBACK_MS);
  const retryCount = toNonNegativeNumber(publicConfig.queryRetryCount, QUERY_RETRY_FALLBACK);
  const refetchOnWindowFocus = toBoolean(
    publicConfig.queryRefetchOnFocus,
    QUERY_REFOCUS_FALLBACK,
  );

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        refetchOnWindowFocus,
        retry: retryCount,
      },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  return {
    provide: {
      queryClient,
    },
  };
});
