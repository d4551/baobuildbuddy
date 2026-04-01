import type { AppSettings } from "@bao/shared/types/settings-contracts";
import { expect, it } from "vitest";
import {
  buildFallbackProviderRows,
  normalizeProviderRows,
  resolveAIRoutingPreference,
  resolveLocalProviderState,
  resolveProviderMetadata,
  resolveProviderModelOptions,
} from "./ai-control-plane";

const buildSettings = (overrides?: Partial<AppSettings>): AppSettings => ({
  id: "default",
  aiRouting: {
    chat: { provider: "local" },
    interviewQuestions: { provider: "local" },
    interviewFeedback: { provider: "local" },
    resume: { provider: "local" },
    coverLetter: { provider: "local" },
    emailResponse: { provider: "local" },
    jobMatch: { provider: "local" },
    scrapeEnrichment: { provider: "local" },
    automationFieldMapping: { provider: "local" },
  },
  preferredProvider: "local",
  theme: "corporate",
  language: "en-US",
  notifications: {
    achievements: true,
    dailyChallenges: true,
    levelUp: true,
    jobAlerts: true,
  },
  ...overrides,
});

it("resolves chat routing from the canonical aiRouting contract", () => {
  const settings = buildSettings({
    aiRouting: {
      ...buildSettings().aiRouting,
      chat: { provider: "openai", model: "gpt-4o-mini" },
    },
    preferredProvider: "claude",
    preferredModel: "claude-sonnet-4-5-20250929",
  });

  expect(resolveAIRoutingPreference(settings, "chat")).toEqual({
    provider: "openai",
    model: "gpt-4o-mini",
  });
});

it("keeps an explicitly cleared local model blank instead of reviving the persisted model", () => {
  const settings = buildSettings({
    localModelEndpoint: "http://localhost:11434/v1",
    localModelName: "qwen2.5:0.5b",
    providerDiagnostics: {
      local: {
        provider: "local",
        code: "healthy",
        checkedAt: "2026-03-25T00:00:00.000Z",
        selectedModel: "llama3.2",
        availableModels: ["llama3.2"],
      },
    },
  });

  const state = resolveLocalProviderState({
    settings,
    endpoint: "",
    model: "",
  });

  expect(state.endpoint).toBe("http://localhost:11434/v1");
  expect(state.configuredModel).toBe("");
  expect(state.selectedModel).toBe("llama3.2");
});

it("merges routed, diagnostic, and catalog model options without duplicates", () => {
  const settings = buildSettings({
    aiRouting: {
      ...buildSettings().aiRouting,
      chat: { provider: "openai", model: "gpt-4o" },
    },
    preferredProvider: "openai",
    preferredModel: "gpt-4o",
    providerDiagnostics: {
      openai: {
        provider: "openai",
        code: "healthy",
        checkedAt: "2026-03-25T00:00:00.000Z",
        selectedModel: "gpt-4o-mini",
        availableModels: ["gpt-4o", "gpt-4o-mini"],
      },
    },
  });

  expect(resolveProviderModelOptions("openai", settings, ["gpt-4o-mini", "gpt-4.1"])).toEqual([
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4-turbo",
  ]);
});

it("normalizes provider rows from the shared models payload", () => {
  expect(
    normalizeProviderRows(
      {
        providers: [
          {
            id: "local",
            models: ["llama3.2"],
            available: true,
            health: "healthy",
          },
        ],
      },
      buildSettings(),
    ),
  ).toEqual([
    {
      id: "local",
      iconId: "local",
      models: ["llama3.2"],
      available: true,
      health: "healthy",
    },
  ]);
});

it("builds fallback provider rows from the canonical provider order", () => {
  const rows = buildFallbackProviderRows(
    buildSettings({
      localModelEndpoint: "http://localhost:11434/v1",
    }),
  );

  expect(rows[0]?.id).toBe("local");
  expect(rows[0]?.health).toBe("degraded");
});

it("resolves provider metadata from the shared catalog", () => {
  expect(resolveProviderMetadata("openai")?.iconId).toBe("openai");
});
