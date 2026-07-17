import { describe, expect, test } from "bun:test";
import type { AutomationSettings, JobProviderSettings } from "./settings-contracts";
import { DEFAULT_AUTOMATION_SETTINGS, DEFAULT_JOB_PROVIDER_SETTINGS } from "./settings-defaults";
import {
  normalizeAutomationSettings,
  normalizeJobProviderSettings,
  normalizeLocalModelEndpoint,
} from "./settings-normalization";

const buildLegacyJobProviderSettings = (): JobProviderSettings => ({
  ...DEFAULT_JOB_PROVIDER_SETTINGS,
  hitmarkerEnabled: true,
  hitmarkerApiBaseUrl: "https://api.hitmarker.test/jobs",
  gamingPortals: DEFAULT_JOB_PROVIDER_SETTINGS.gamingPortals.map((portal) =>
    portal.id === "hitmarker"
      ? {
          ...portal,
          enabled: true,
          fallbackUrl: "https://example.com/hitmarker",
        }
      : portal,
  ),
});

describe("job provider normalization", () => {
  test("replaces legacy placeholder hitmarker endpoints with current defaults", () => {
    const normalized = normalizeJobProviderSettings(buildLegacyJobProviderSettings());

    expect(normalized.hitmarkerApiBaseUrl).toBe(DEFAULT_JOB_PROVIDER_SETTINGS.hitmarkerApiBaseUrl);
    expect(normalized.gamingPortals.find((portal) => portal.id === "hitmarker")?.fallbackUrl).toBe(
      DEFAULT_JOB_PROVIDER_SETTINGS.gamingPortals.find((portal) => portal.id === "hitmarker")
        ?.fallbackUrl,
    );
  });

  test("preserves non-placeholder custom provider values", () => {
    const customSettings: JobProviderSettings = {
      ...buildLegacyJobProviderSettings(),
      hitmarkerApiBaseUrl: "https://jobs.internal.example.org/hitmarker-feed",
      gamingPortals: DEFAULT_JOB_PROVIDER_SETTINGS.gamingPortals.map((portal) =>
        portal.id === "hitmarker"
          ? {
              ...portal,
              enabled: true,
              fallbackUrl: "https://jobs.internal.example.org/hitmarker",
            }
          : portal,
      ),
    };

    const normalized = normalizeJobProviderSettings(customSettings);

    expect(normalized.hitmarkerApiBaseUrl).toBe(customSettings.hitmarkerApiBaseUrl);
    expect(normalized.gamingPortals.find((portal) => portal.id === "hitmarker")?.fallbackUrl).toBe(
      "https://jobs.internal.example.org/hitmarker",
    );
  });
});

describe("normalizeAutomationSettings", () => {
  test("normalizes nested job provider settings", () => {
    const automationSettings: AutomationSettings = {
      ...DEFAULT_AUTOMATION_SETTINGS,
      jobProviders: buildLegacyJobProviderSettings(),
    };

    const normalized = normalizeAutomationSettings(automationSettings);

    expect(normalized.jobProviders.hitmarkerApiBaseUrl).toBe(
      DEFAULT_JOB_PROVIDER_SETTINGS.hitmarkerApiBaseUrl,
    );
  });
});

describe("normalizeLocalModelEndpoint", () => {
  test("upgrades the legacy Ollama root endpoint to the OpenAI Chat Completions v1 route", () => {
    expect(normalizeLocalModelEndpoint("http://localhost:11434")).toBe("http://localhost:11434/v1");
    expect(normalizeLocalModelEndpoint("http://127.0.0.1:11434/")).toBe(
      "http://localhost:11434/v1",
    );
  });

  test("preserves custom model endpoints", () => {
    expect(normalizeLocalModelEndpoint("https://models.internal.example/v1")).toBe(
      "https://models.internal.example/v1",
    );
  });
});
