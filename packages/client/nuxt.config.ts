import { APP_BRAND } from "@bao/shared";

const apiBaseProxy = process.env.NUXT_PUBLIC_API_BASE || process.env.NUXT_PUBLIC_API_PROXY;
const DECIMAL_RADIX = 10;
const DEFAULT_QUERY_STALE_TIME_MS = 60_000;
const DEFAULT_QUERY_RETRY_COUNT = 1;
const QUERY_REFOCUS_DISABLED = "false";
const NUXT_COMPATIBILITY_DATE = "2025-01-01";
const DEFAULT_APP_TITLE = `${APP_BRAND.name} - AI Career Assistant`;
const DEFAULT_APP_DESCRIPTION = "AI-powered career assistant for the video game industry";
const DEFAULT_I18N_LOCALE = "en-US";
const DEFAULT_I18N_LOCALE_COOKIE_KEY = "bao-locale";
const DEFAULT_SUPPORTED_LOCALES = [DEFAULT_I18N_LOCALE];

const parseSupportedLocales = (value: string | undefined): string[] => {
  const parsedLocales = value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return parsedLocales && parsedLocales.length > 0 ? parsedLocales : DEFAULT_SUPPORTED_LOCALES;
};

export default defineNuxtConfig({
  modules: ["@nuxt/image", "@nuxt/test-utils/module"],
  compatibilityDate: NUXT_COMPATIBILITY_DATE,
  devtools: { enabled: true },

  build: {
    transpile: ["@bao/shared"],
  },

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
    css: {
      devSourcemap: true,
    },
    build: {
      sourcemap: false,
    },
    optimizeDeps: {
      include: ["zod"],
    },
    resolve: {
      dedupe: ["zod"],
      conditions: ["import", "module", "default"],
    },
    ssr: {
      noExternal: ["@bao/shared", "zod"],
    },
  },

  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
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
      appTitle: process.env.NUXT_PUBLIC_APP_TITLE || DEFAULT_APP_TITLE,
      appDescription: process.env.NUXT_PUBLIC_APP_DESCRIPTION || DEFAULT_APP_DESCRIPTION,
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
      i18n: {
        defaultLocale: process.env.NUXT_PUBLIC_I18N_DEFAULT_LOCALE || DEFAULT_I18N_LOCALE,
        fallbackLocale: process.env.NUXT_PUBLIC_I18N_FALLBACK_LOCALE || DEFAULT_I18N_LOCALE,
        localeCookieKey:
          process.env.NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY || DEFAULT_I18N_LOCALE_COOKIE_KEY,
        supportedLocales: parseSupportedLocales(process.env.NUXT_PUBLIC_I18N_SUPPORTED_LOCALES),
      },
    },
  },

  typescript: {
    strict: true,
  },

  app: {
    pageTransition: {
      name: "page",
      mode: "out-in",
    },
    head: {
      title: process.env.NUXT_PUBLIC_APP_TITLE || DEFAULT_APP_TITLE,
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content: process.env.NUXT_PUBLIC_APP_DESCRIPTION || DEFAULT_APP_DESCRIPTION,
        },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "alternate icon", href: "/favicon.svg" },
      ],
      htmlAttrs: {
        lang: process.env.NUXT_PUBLIC_I18N_DEFAULT_LOCALE || DEFAULT_I18N_LOCALE,
      },
    },
  },
});
