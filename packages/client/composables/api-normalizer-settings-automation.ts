import { DEFAULT_SPEECH_SETTINGS, SPEECH_PROVIDER_OPTIONS } from "@bao/shared/constants/settings";
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import { normalizeJobProviderSettings as normalizeSharedJobProviderSettings } from "@bao/shared/types/settings-normalization";
import { asBoolean, asNumber, asString, isRecord } from "@bao/shared/utils/type-guards";
import {
  COMPANY_BOARD_ATS_TYPES,
  COMPANY_BOARD_TEMPLATE_KEYS,
  GAMING_PORTAL_IDS,
  SPEECH_AUDIO_FORMATS,
} from "~/composables/api-normalizer-settings-constants";
import { asEnum } from "~/composables/api-normalizer-shared";

const normalizeGreenhouseBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["greenhouseBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        board: asString(board.board) ?? "",
        company: asString(board.company) ?? "",
        enabled: asBoolean(board.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseBoards;

const normalizeLeverCompanies = (
  value: unknown,
): AutomationSettings["jobProviders"]["leverCompanies"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((company) => ({
        slug: asString(company.slug) ?? "",
        company: asString(company.company) ?? "",
        enabled: asBoolean(company.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverCompanies;

const normalizeCompanyBoardTemplates = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoardApiTemplates"] => {
  if (!isRecord(value)) return DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates;
  const templates = { ...DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates };
  for (const key of COMPANY_BOARD_TEMPLATE_KEYS) {
    const nextTemplate = asString(value[key]);
    if (nextTemplate) templates[key] = nextTemplate;
  }
  return templates;
};

const normalizeCompanyBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        name: asString(board.name) ?? "",
        token: asString(board.token) ?? "",
        type: asEnum(board.type, COMPANY_BOARD_ATS_TYPES) ?? "greenhouse",
        enabled: asBoolean(board.enabled) ?? false,
        priority: asNumber(board.priority) ?? 0,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoards;

const normalizeGamingPortals = (
  value: unknown,
): AutomationSettings["jobProviders"]["gamingPortals"] => {
  if (!Array.isArray(value)) return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals;

  const configuredPortals = value.filter(isRecord);
  return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals.map((defaultPortal, index) => {
    const matchedPortal =
      configuredPortals.find(
        (portal) => asEnum(portal.id, GAMING_PORTAL_IDS) === defaultPortal.id,
      ) ?? configuredPortals[index];

    return {
      id: defaultPortal.id,
      name: asString(matchedPortal?.name) ?? defaultPortal.name,
      source: asString(matchedPortal?.source) ?? defaultPortal.source,
      fallbackUrl: asString(matchedPortal?.fallbackUrl) ?? defaultPortal.fallbackUrl,
      enabled: asBoolean(matchedPortal?.enabled) ?? defaultPortal.enabled,
    };
  });
};

const normalizeJobProviderSettings = (value: unknown): AutomationSettings["jobProviders"] => {
  if (!isRecord(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders;
  }

  return normalizeSharedJobProviderSettings({
    ...DEFAULT_AUTOMATION_SETTINGS.jobProviders,
    providerTimeoutMs:
      asNumber(value.providerTimeoutMs) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.providerTimeoutMs,
    companyBoardResultLimit:
      asNumber(value.companyBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardResultLimit,
    gamingBoardResultLimit:
      asNumber(value.gamingBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingBoardResultLimit,
    unknownLocationLabel:
      asString(value.unknownLocationLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownLocationLabel,
    unknownCompanyLabel:
      asString(value.unknownCompanyLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownCompanyLabel,
    hitmarkerEnabled:
      asBoolean(value.hitmarkerEnabled) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerEnabled,
    hitmarkerApiBaseUrl:
      asString(value.hitmarkerApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerApiBaseUrl,
    hitmarkerDefaultQuery:
      asString(value.hitmarkerDefaultQuery) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultQuery,
    hitmarkerDefaultLocation:
      asString(value.hitmarkerDefaultLocation) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultLocation,
    greenhouseApiBaseUrl:
      asString(value.greenhouseApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseApiBaseUrl,
    greenhouseMaxPages:
      asNumber(value.greenhouseMaxPages) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseMaxPages,
    greenhouseBoards: normalizeGreenhouseBoards(value.greenhouseBoards),
    leverApiBaseUrl:
      asString(value.leverApiBaseUrl) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverApiBaseUrl,
    leverMaxPages:
      asNumber(value.leverMaxPages) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverMaxPages,
    leverCompanies: normalizeLeverCompanies(value.leverCompanies),
    companyBoardApiTemplates: normalizeCompanyBoardTemplates(value.companyBoardApiTemplates),
    companyBoards: normalizeCompanyBoards(value.companyBoards),
    gamingPortals: normalizeGamingPortals(value.gamingPortals),
  });
};

const normalizeSpeechSettings = (value: unknown): AutomationSettings["speech"] => {
  if (!isRecord(value)) {
    return {
      locale: DEFAULT_SPEECH_SETTINGS.locale,
      stt: {
        provider: DEFAULT_SPEECH_SETTINGS.stt.provider,
        model: DEFAULT_SPEECH_SETTINGS.stt.model,
        endpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
      },
      tts: {
        provider: DEFAULT_SPEECH_SETTINGS.tts.provider,
        model: DEFAULT_SPEECH_SETTINGS.tts.model,
        endpoint: DEFAULT_SPEECH_SETTINGS.tts.endpoint,
        voice: DEFAULT_SPEECH_SETTINGS.tts.voice,
        format: DEFAULT_SPEECH_SETTINGS.tts.format,
      },
    };
  }

  const stt = isRecord(value.stt) ? value.stt : {};
  const tts = isRecord(value.tts) ? value.tts : {};
  const sttProvider =
    asEnum(stt.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.stt.provider;
  const ttsProvider =
    asEnum(tts.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.tts.provider;

  return {
    locale: asString(value.locale) ?? DEFAULT_SPEECH_SETTINGS.locale,
    stt: {
      provider: sttProvider,
      model: asString(stt.model) ?? DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: asString(stt.endpoint) ?? DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    },
    tts: {
      provider: ttsProvider,
      model: asString(tts.model) ?? DEFAULT_SPEECH_SETTINGS.tts.model,
      endpoint: asString(tts.endpoint) ?? DEFAULT_SPEECH_SETTINGS.tts.endpoint,
      voice: asString(tts.voice) ?? DEFAULT_SPEECH_SETTINGS.tts.voice,
      format: asEnum(tts.format, SPEECH_AUDIO_FORMATS) ?? DEFAULT_SPEECH_SETTINGS.tts.format,
    },
  };
};

export const normalizeAutomationSettings = (value: unknown): AutomationSettings | undefined => {
  if (!isRecord(value)) return;

  return {
    headless: asBoolean(value.headless) ?? DEFAULT_AUTOMATION_SETTINGS.headless,
    defaultTimeout: asNumber(value.defaultTimeout) ?? DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    screenshotRetention:
      asNumber(value.screenshotRetention) ?? DEFAULT_AUTOMATION_SETTINGS.screenshotRetention,
    maxConcurrentRuns:
      asNumber(value.maxConcurrentRuns) ?? DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns,
    defaultBrowser:
      value.defaultBrowser === "chromium" || value.defaultBrowser === "edge"
        ? value.defaultBrowser
        : DEFAULT_AUTOMATION_SETTINGS.defaultBrowser,
    enableSmartSelectors:
      asBoolean(value.enableSmartSelectors) ?? DEFAULT_AUTOMATION_SETTINGS.enableSmartSelectors,
    autoSaveScreenshots:
      asBoolean(value.autoSaveScreenshots) ?? DEFAULT_AUTOMATION_SETTINGS.autoSaveScreenshots,
    speech: normalizeSpeechSettings(value.speech),
    jobProviders: normalizeJobProviderSettings(value.jobProviders),
  };
};
