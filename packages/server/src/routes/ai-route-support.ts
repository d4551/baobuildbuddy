import { AI_PROVIDER_CATALOG } from "@bao/shared/constants/ai-provider";
import { API_MESSAGE_AI_NO_PROVIDERS } from "@bao/shared/constants/api-messages";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { buildAIControlPlaneState } from "../services/ai/control-plane";

export async function getAISettingsRow() {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return settingsRows[0];
}

export async function getAIService(settingsRow?: Awaited<ReturnType<typeof getAISettingsRow>>) {
  const resolvedSettingsRow = settingsRow ?? (await getAISettingsRow());
  return AIService.fromSettings(resolvedSettingsRow);
}

export async function buildProviderModelsResponse() {
  const settingsRow = await getAISettingsRow();
  if (!settingsRow) {
    return {
      providers: AI_PROVIDER_CATALOG.map((provider) => ({
        id: provider.id,
        nameKey: provider.nameKey,
        descriptionKey: provider.descriptionKey,
        iconId: provider.iconId,
        models: [...provider.modelHints],
        available: false,
        health: "unconfigured" as const,
      })),
      error: API_MESSAGE_AI_NO_PROVIDERS,
    };
  }

  return buildAIControlPlaneState(settingsRow);
}
