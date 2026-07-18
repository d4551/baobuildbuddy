import { AI_PROVIDER_DEFAULT } from "@bao/shared/constants/ai-provider";
import type { AppLanguageCode } from "@bao/shared/constants/settings";
import type { AIProviderType, AIRouting, AIRoutingPurpose } from "@bao/shared/types/ai";
import type { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import { resolveLocaleLabel } from "~/constants/i18n";
import { resolveProviderModelOptions } from "~/utils/ai-control-plane";
import { getErrorMessage } from "~/utils/errors";
import { settlePromise } from "../async-flow";

export type TranslateFn = ReturnType<typeof useI18n>["t"];

export interface ToastApi {
  error(message: string): void;
  success(message: string): void;
}

export type BrandEditorPanel = "identity" | "typography" | "themes" | "content";
export type AIRoutingDraft = Record<AIRoutingPurpose, { provider: AIProviderType; model: string }>;

export type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

export type ProviderInputConfig = {
  id: AIProviderType;
  label: string;
  description: string;
  field: ProviderField;
};

export type ProviderTestState = { valid: boolean; message?: string } | null;
type ProviderSettingsSnapshot = Parameters<typeof resolveProviderModelOptions>[1];

export const providerFieldById = {
  local: "localModelEndpoint",
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
} satisfies Record<AIProviderType, ProviderField>;

export function createDefaultAiRoutingDraft(): AIRoutingDraft {
  const defaultDraftTarget = { provider: AI_PROVIDER_DEFAULT, model: "" };
  return {
    chat: { ...defaultDraftTarget },
    interviewQuestions: { ...defaultDraftTarget },
    interviewFeedback: { ...defaultDraftTarget },
    resume: { ...defaultDraftTarget },
    coverLetter: { ...defaultDraftTarget },
    emailResponse: { ...defaultDraftTarget },
    jobMatch: { ...defaultDraftTarget },
    scrapeEnrichment: { ...defaultDraftTarget },
    automationFieldMapping: { ...defaultDraftTarget },
  };
}

export function assignAiRoutingDraft(target: AIRoutingDraft, source: AIRouting): void {
  target.chat.provider = source.chat.provider;
  target.chat.model = source.chat.model ?? "";
  target.interviewQuestions.provider = source.interviewQuestions.provider;
  target.interviewQuestions.model = source.interviewQuestions.model ?? "";
  target.interviewFeedback.provider = source.interviewFeedback.provider;
  target.interviewFeedback.model = source.interviewFeedback.model ?? "";
  target.resume.provider = source.resume.provider;
  target.resume.model = source.resume.model ?? "";
  target.coverLetter.provider = source.coverLetter.provider;
  target.coverLetter.model = source.coverLetter.model ?? "";
  target.emailResponse.provider = source.emailResponse.provider;
  target.emailResponse.model = source.emailResponse.model ?? "";
  target.jobMatch.provider = source.jobMatch.provider;
  target.jobMatch.model = source.jobMatch.model ?? "";
  target.scrapeEnrichment.provider = source.scrapeEnrichment.provider;
  target.scrapeEnrichment.model = source.scrapeEnrichment.model ?? "";
  target.automationFieldMapping.provider = source.automationFieldMapping.provider;
  target.automationFieldMapping.model = source.automationFieldMapping.model ?? "";
}

export function buildAiRoutingPayload(draft: AIRoutingDraft): AIRouting {
  const toTarget = (value: AIRoutingDraft[AIRoutingPurpose]): AIRouting[AIRoutingPurpose] => {
    const model = value.model.trim();
    return model ? { provider: value.provider, model } : { provider: value.provider };
  };

  return {
    chat: toTarget(draft.chat),
    interviewQuestions: toTarget(draft.interviewQuestions),
    interviewFeedback: toTarget(draft.interviewFeedback),
    resume: toTarget(draft.resume),
    coverLetter: toTarget(draft.coverLetter),
    emailResponse: toTarget(draft.emailResponse),
    jobMatch: toTarget(draft.jobMatch),
    scrapeEnrichment: toTarget(draft.scrapeEnrichment),
    automationFieldMapping: toTarget(draft.automationFieldMapping),
  };
}

export function parseDelimitedList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function buildLanguageLabel(t: TranslateFn, value: AppLanguageCode): string {
  return resolveLocaleLabel(t, value);
}

function resolveDraftModelOptions(
  providerId: AIProviderType,
  settings: ProviderSettingsSnapshot,
  localModelName: string,
): string[] {
  return resolveProviderModelOptions(
    providerId,
    settings,
    providerId === "local" ? [localModelName] : [],
  );
}

export function resolveRoutingModelOptionsMap(
  draft: AIRoutingDraft,
  settings: ProviderSettingsSnapshot,
  localModelName: string,
): Record<AIRoutingPurpose, string[]> {
  return {
    chat: resolveDraftModelOptions(draft.chat.provider, settings, localModelName),
    interviewQuestions: resolveDraftModelOptions(
      draft.interviewQuestions.provider,
      settings,
      localModelName,
    ),
    interviewFeedback: resolveDraftModelOptions(
      draft.interviewFeedback.provider,
      settings,
      localModelName,
    ),
    resume: resolveDraftModelOptions(draft.resume.provider, settings, localModelName),
    coverLetter: resolveDraftModelOptions(draft.coverLetter.provider, settings, localModelName),
    emailResponse: resolveDraftModelOptions(draft.emailResponse.provider, settings, localModelName),
    jobMatch: resolveDraftModelOptions(draft.jobMatch.provider, settings, localModelName),
    scrapeEnrichment: resolveDraftModelOptions(
      draft.scrapeEnrichment.provider,
      settings,
      localModelName,
    ),
    automationFieldMapping: resolveDraftModelOptions(
      draft.automationFieldMapping.provider,
      settings,
      localModelName,
    ),
  };
}

export function browserOptionLabel(
  t: TranslateFn,
  browser: "chrome" | "chromium" | "edge",
): string {
  if (browser === "chrome") return t("settings.automation.browserOptions.chrome");
  if (browser === "chromium") return t("settings.automation.browserOptions.chromium");
  return t("settings.automation.browserOptions.edge");
}

export function emailTransportSecurityLabel(
  t: TranslateFn,
  security: "tls" | "plain" | "starttls",
): string {
  if (security === "tls") {
    return t("settings.emailDelivery.securityOptions.tls");
  }
  if (security === "plain") {
    return t("settings.emailDelivery.securityOptions.plain");
  }
  return t("settings.emailDelivery.securityOptions.starttls");
}

export function emailTransportAuthModeLabel(t: TranslateFn, authMode: "login" | "plain"): string {
  if (authMode === "login") {
    return t("settings.emailDelivery.authOptions.login");
  }
  return t("settings.emailDelivery.authOptions.plain");
}

export function showToastError(toast: ToastApi, error: unknown, fallback: string): void {
  toast.error(getErrorMessage(error, fallback));
}

export async function runToastTask<T>(
  task: Promise<T>,
  failureMessage: string,
  toast: ToastApi,
): Promise<T | null> {
  const result = await settlePromise(task, failureMessage);
  if (!result.ok) {
    showToastError(toast, result.error, failureMessage);
    return null;
  }
  return result.value;
}

interface StatefulSaveOptions<T> {
  readonly state: { value: SaveState };
  readonly task: Promise<T>;
  readonly failureMessage: string;
  readonly successMessage: string;
  readonly toast: ToastApi;
}

export async function runStatefulSave<T>(options: StatefulSaveOptions<T>): Promise<T | null> {
  options.state.value = "saving";
  const value = await runToastTask(options.task, options.failureMessage, options.toast);
  if (value === null) {
    options.state.value = "error";
    return null;
  }
  options.state.value = "success";
  options.toast.success(options.successMessage);
  return value;
}
