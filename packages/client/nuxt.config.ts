import tailwindcss from "@tailwindcss/vite";

const apiBaseProxy = process.env.NUXT_PUBLIC_API_BASE || process.env.NUXT_PUBLIC_API_PROXY;
const DECIMAL_RADIX = 10;
const DEFAULT_QUERY_STALE_TIME_MS = 60_000;
const DEFAULT_QUERY_RETRY_COUNT = 1;
const QUERY_REFOCUS_DISABLED = "false";
const NUXT_COMPATIBILITY_DATE = "2025-01-01";

export default defineNuxtConfig({
  modules: ["@nuxt/image", "@nuxt/test-utils/module"],
  compatibilityDate: NUXT_COMPATIBILITY_DATE,
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  sourcemap: {
    server: true,
    client: false,
  },

  vite: {
    plugins: [tailwindcss()],
    css: {
      devSourcemap: true,
    },
    build: {
      sourcemap: false,
    },
  },

  nitro: {
    ...(apiBaseProxy
      ? {
          devProxy: {
            "/api": {
              target: apiBaseProxy,
              changeOrigin: true,
            },
          },
        }
      : {}),
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "/",
      wsBase: process.env.NUXT_PUBLIC_WS_BASE || "/",
      queryStaleTimeMs: Number.parseInt(
        process.env.NUXT_PUBLIC_QUERY_STALE_TIME_MS || String(DEFAULT_QUERY_STALE_TIME_MS),
        DECIMAL_RADIX,
      ),
      queryRetryCount: Number.parseInt(
        process.env.NUXT_PUBLIC_QUERY_RETRY_COUNT || String(DEFAULT_QUERY_RETRY_COUNT),
        DECIMAL_RADIX,
      ),
      queryRefetchOnFocus:
        process.env.NUXT_PUBLIC_QUERY_REFETCH_ON_FOCUS !== QUERY_REFOCUS_DISABLED,
    },
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: "BaoBuildBuddy - AI Career Assistant",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "description", content: "AI-powered career assistant for the video game industry" },
      ],
      htmlAttrs: {
        lang: "en",
      },
    },
  },
});
