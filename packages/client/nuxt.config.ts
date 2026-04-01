import { APP_BRAND } from "@bao/shared/constants/branding";
import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import {
  APP_BRAND_TAGLINE,
  DECIMAL_RADIX,
  DEFAULT_APP_DESCRIPTION,
  DEFAULT_I18N_LOCALE_COOKIE_KEY,
  DEFAULT_QUERY_RETRY_COUNT,
  DEFAULT_QUERY_STALE_TIME_MS,
  LOCALES_DIRECTORY_SEGMENT,
  LOCALE_CHUNK_NAME_PREFIX,
  LOCALE_FILE_EXTENSION,
  MODULE_PATH_SEPARATOR,
  NODE_MODULES_PATH_SEGMENT,
  NUXT_COMPATIBILITY_DATE,
  PNPM_PATH_SEGMENT,
  QUERY_REFETCH_ON_FOCUS_DISABLED,
  VITE_BUILD_TARGET,
  WINDOWS_PATH_SEPARATOR,
} from "@bao/shared/constants/client-config";
import { DEFAULT_CLIENT_DEV_PORT, DEFAULT_SERVER_PORT } from "@bao/shared/constants/ports";
import { APP_LANGUAGE_CODES, DEFAULT_APP_LANGUAGE } from "@bao/shared/constants/settings";
import { defineNuxtConfig } from "nuxt/config";
import { buildApiProxyWildcardTarget, normalizeApiProxyTarget } from "./utils/api-proxy-target";

const DEFAULT_CLIENT_PORT = String(DEFAULT_CLIENT_DEV_PORT);
const DEFAULT_API_SERVER_PORT = String(DEFAULT_SERVER_PORT);
const API_ENDPOINT_WILDCARD = `${API_ENDPOINT_PREFIX}/**`;
const configuredApiBase = process.env.NUXT_PUBLIC_API_BASE;
const configuredApiProxy = process.env.NUXT_PUBLIC_API_PROXY;
const configuredServerPort = process.env.SERVER_PORT || process.env.PORT;
const resolvedApiServerPort =
  configuredServerPort && configuredServerPort.length > 0
    ? configuredServerPort
    : DEFAULT_API_SERVER_PORT;
const configuredClientPort = process.env.CLIENT_PORT || process.env.NUXT_CLIENT_PORT;
const resolvedDevServerPort =
  configuredClientPort && configuredClientPort.length > 0
    ? configuredClientPort
    : DEFAULT_CLIENT_PORT;
const defaultLocalApiProxy = `http://localhost:${resolvedApiServerPort}`;
const HTTPS_URL_PATTERN = /^https?:\/\//u;
const absoluteConfiguredApiBase =
  configuredApiBase && HTTPS_URL_PATTERN.test(configuredApiBase) ? configuredApiBase : undefined;
const apiProxyCandidate = configuredApiProxy || absoluteConfiguredApiBase || defaultLocalApiProxy;
const normalizedApiProxyTarget = normalizeApiProxyTarget(apiProxyCandidate);
const apiProxyWildcardTarget = normalizedApiProxyTarget
  ? buildApiProxyWildcardTarget(normalizedApiProxyTarget)
  : undefined;
const DEFAULT_APP_TITLE = `${APP_BRAND.name} - ${APP_BRAND_TAGLINE}`;
const DEFAULT_I18N_LOCALE = DEFAULT_APP_LANGUAGE;
const DEFAULT_SUPPORTED_LOCALES = [...APP_LANGUAGE_CODES];

type VendorChunkRule = {
  chunkName: string;
  packagePrefixes: readonly string[];
};

const parseSupportedLocales = (value: string | undefined): string[] => {
  const parsedLocales = value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return parsedLocales && parsedLocales.length > 0 ? parsedLocales : DEFAULT_SUPPORTED_LOCALES;
};

const createLocaleChunkMap = (localeCodes: readonly string[]): Record<string, string> => {
  const localeChunkMap: Record<string, string> = {};
  for (const localeCode of localeCodes) {
    localeChunkMap[`${localeCode}${LOCALE_FILE_EXTENSION}`] =
      `${LOCALE_CHUNK_NAME_PREFIX}${localeCode}`;
  }
  return localeChunkMap;
};

const LOCALE_CHUNK_NAME_BY_FILE = createLocaleChunkMap(APP_LANGUAGE_CODES);

const VENDOR_CHUNK_RULES: readonly VendorChunkRule[] = [
  {
    chunkName: "vendor-vue",
    packagePrefixes: ["vue", "@vue/", "vue-router"],
  },
  {
    chunkName: "vendor-nuxt",
    packagePrefixes: ["nuxt", "@nuxt/", "nitropack", "h3", "ofetch", "ufo", "hookable"],
  },
  {
    chunkName: "vendor-i18n",
    packagePrefixes: ["vue-i18n", "@intlify/"],
  },
  {
    chunkName: "vendor-query",
    packagePrefixes: ["@tanstack/"],
  },
  {
    chunkName: "vendor-zod",
    packagePrefixes: ["zod"],
  },
];

const hasOwnKey = <T extends object>(value: T, key: PropertyKey): key is keyof T =>
  Object.hasOwn(value, key);

const normalizeModuleId = (moduleId: string): string =>
  moduleId.replaceAll(WINDOWS_PATH_SEPARATOR, MODULE_PATH_SEPARATOR);

const matchesPackagePrefix = (packageName: string, prefix: string): boolean =>
  packageName === prefix || packageName.startsWith(prefix);

const resolveNodeModulePackageName = (normalizedModuleId: string): string | null => {
  const nodeModulesIndex = normalizedModuleId.lastIndexOf(NODE_MODULES_PATH_SEGMENT);
  if (nodeModulesIndex === -1) {
    return null;
  }

  let packagePath = normalizedModuleId.slice(nodeModulesIndex + NODE_MODULES_PATH_SEGMENT.length);
  if (packagePath.startsWith(PNPM_PATH_SEGMENT)) {
    const nestedNodeModulesIndex = packagePath.indexOf(NODE_MODULES_PATH_SEGMENT);
    packagePath =
      nestedNodeModulesIndex === -1
        ? packagePath
        : packagePath.slice(nestedNodeModulesIndex + NODE_MODULES_PATH_SEGMENT.length);
  }

  const pathSegments = packagePath
    .split(MODULE_PATH_SEPARATOR)
    .filter((segment) => segment.length > 0);
  if (pathSegments.length === 0) {
    return null;
  }

  const [firstPathSegment, secondPathSegment] = pathSegments;
  if (!firstPathSegment) {
    return null;
  }

  if (firstPathSegment.startsWith("@") && secondPathSegment) {
    return `${firstPathSegment}/${secondPathSegment}`;
  }

  return firstPathSegment;
};

const resolveVendorChunkName = (packageName: string): string | undefined => {
  for (const rule of VENDOR_CHUNK_RULES) {
    if (rule.packagePrefixes.some((prefix) => matchesPackagePrefix(packageName, prefix))) {
      return rule.chunkName;
    }
  }
};

const resolveManualChunkName = (moduleId: string): string | undefined => {
  const normalizedModuleId = normalizeModuleId(moduleId);
  if (!normalizedModuleId.includes(LOCALES_DIRECTORY_SEGMENT)) {
    const packageName = resolveNodeModulePackageName(normalizedModuleId);
    if (!packageName) {
      return;
    }

    return resolveVendorChunkName(packageName);
  }

  const fileName = normalizedModuleId.split(MODULE_PATH_SEPARATOR).pop();
  if (!(fileName && hasOwnKey(LOCALE_CHUNK_NAME_BY_FILE, fileName))) {
    return;
  }

  return LOCALE_CHUNK_NAME_BY_FILE[fileName];
};

const resolvedApiBase = configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : "/";
const configuredWsBase = process.env.NUXT_PUBLIC_WS_BASE;
const resolvedWsBase =
  configuredWsBase && configuredWsBase !== "/" ? configuredWsBase : resolvedApiBase;
const shouldPrerenderApplicationRoutes =
  Boolean(apiProxyWildcardTarget) ||
  Boolean(configuredApiBase && HTTPS_URL_PATTERN.test(configuredApiBase));

export default defineNuxtConfig({
  modules: ["@nuxt/image", "@nuxt/test-utils/module"],
  compatibilityDate: NUXT_COMPATIBILITY_DATE,
  buildDir: ".nuxt",
  devtools: { enabled: true },
  $development: {
    sourcemap: {
      client: false,
      server: true,
    },
  },
  $production: {
    sourcemap: {
      // Avoid shipping SSR .map files (path leakage, larger deploy); client maps stay off via vite.build.
      client: false,
      server: false,
    },
  },
  experimental: {
    componentIslands: false,
  },
  hooks: {
    "prerender:routes": (context: { routes: Set<string> }) => {
      if (shouldPrerenderApplicationRoutes) {
        return;
      }

      context.routes.clear();
    },
  },

  devServer: {
    port: Number(resolvedDevServerPort),
  },

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

  vite: {
    css: {
      devSourcemap: true,
    },
    build: {
      target: VITE_BUILD_TARGET,
      modulePreload: {
        polyfill: false,
      },
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunkName,
        },
      },
    },
    optimizeDeps: {
      include: ["zod"],
    },
    resolve: {
      dedupe: ["zod"],
      conditions: ["import", "module", "default"],
    },
    ssr: {
      noExternal: ["@bao/shared"],
    },
  },

  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
    },
  },

  nitro: {
    preset: "bun",
    ...(normalizedApiProxyTarget
      ? {
          devProxy: {
            [API_ENDPOINT_PREFIX]: {
              target: normalizedApiProxyTarget,
              changeOrigin: true,
            },
          },
          ...(apiProxyWildcardTarget
            ? {
                routeRules: {
                  [API_ENDPOINT_WILDCARD]: {
                    proxy: apiProxyWildcardTarget,
                  },
                },
              }
            : {}),
        }
      : {}),
  },

  runtimeConfig: {
    public: {
      apiBase: resolvedApiBase,
      wsBase: resolvedWsBase,
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
        process.env.NUXT_PUBLIC_QUERY_REFETCH_ON_FOCUS !== QUERY_REFETCH_ON_FOCUS_DISABLED,
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
