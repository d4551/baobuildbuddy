import { LOCAL_AI_DEFAULT_ENDPOINT } from "../constants/ai-provider";
import { validateLocalAiEndpoint } from "../utils/local-ai-endpoint";
import type {
  AutomationSettings,
  GamingPortalConfig,
  JobProviderSettings,
} from "./settings-contracts";
import { DEFAULT_AUTOMATION_SETTINGS, DEFAULT_JOB_PROVIDER_SETTINGS } from "./settings-defaults";

const PLACEHOLDER_HOST_SNIPPETS = [".test", "example.com"] as const;
const LEGACY_LOCAL_AI_ENDPOINTS = ["http://localhost:11434", "http://127.0.0.1:11434"] as const;
const TRAILING_SLASHES_PATTERN = /\/+$/u;

const isPlaceholderUrl = (value: string): boolean =>
  PLACEHOLDER_HOST_SNIPPETS.some((snippet) => value.includes(snippet));

const normalizeUrl = (value: string, fallback: string): string => {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0 || isPlaceholderUrl(trimmedValue)) {
    return fallback;
  }
  return trimmedValue;
};

const normalizePortalConfig = (
  portal: GamingPortalConfig | undefined,
  fallbackPortal: GamingPortalConfig,
): GamingPortalConfig => ({
  id: fallbackPortal.id,
  name: portal?.name.trim() ? portal.name.trim() : fallbackPortal.name,
  source: portal?.source.trim() ? portal.source.trim() : fallbackPortal.source,
  fallbackUrl: normalizeUrl(portal?.fallbackUrl ?? "", fallbackPortal.fallbackUrl),
  enabled: typeof portal?.enabled === "boolean" ? portal.enabled : fallbackPortal.enabled,
});

export const normalizeJobProviderSettings = (
  settings: JobProviderSettings,
): JobProviderSettings => {
  const portalById = new Map(settings.gamingPortals.map((portal) => [portal.id, portal]));

  return {
    ...settings,
    hitmarkerApiBaseUrl: normalizeUrl(
      settings.hitmarkerApiBaseUrl,
      DEFAULT_JOB_PROVIDER_SETTINGS.hitmarkerApiBaseUrl,
    ),
    gamingPortals: DEFAULT_JOB_PROVIDER_SETTINGS.gamingPortals.map((fallbackPortal) =>
      normalizePortalConfig(portalById.get(fallbackPortal.id), fallbackPortal),
    ),
  };
};

export const normalizeAutomationSettings = (settings: AutomationSettings): AutomationSettings => ({
  ...DEFAULT_AUTOMATION_SETTINGS,
  ...settings,
  jobProviders: normalizeJobProviderSettings(settings.jobProviders),
});

export const normalizeLocalModelEndpoint = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim().replace(TRAILING_SLASHES_PATTERN, "");
  if (trimmedValue.length === 0) {
    return null;
  }

  const legacyNormalized = LEGACY_LOCAL_AI_ENDPOINTS.some((endpoint) => endpoint === trimmedValue)
    ? LOCAL_AI_DEFAULT_ENDPOINT
    : trimmedValue;

  const validated = validateLocalAiEndpoint(legacyNormalized);
  return validated.ok ? validated.endpoint.replace(TRAILING_SLASHES_PATTERN, "") : null;
};
