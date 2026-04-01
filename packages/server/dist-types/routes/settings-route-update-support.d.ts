import { type AppDataTheme } from "@bao/shared/constants/branding";
import type { AIProviderType, AIRouting } from "@bao/shared/types/ai";
import type { AutomationSettings, BrandSettingsPatch, EmailTransportSettings, NotificationPreferences } from "@bao/shared/types/settings-contracts";
import type { settings as settingsTable } from "../db/schema/settings";
type SettingsRow = typeof settingsTable.$inferSelect;
type SettingsInsert = typeof settingsTable.$inferInsert;
interface SettingsUpdateInput {
    aiRouting?: AIRouting;
    preferredProvider?: AIProviderType;
    preferredModel?: string;
    theme?: AppDataTheme | "bao-light" | "bao-dark";
    language?: string;
    brandSettings?: BrandSettingsPatch;
    notifications?: Partial<NotificationPreferences>;
    automationSettings?: Partial<AutomationSettings>;
    emailTransportSettings?: Partial<EmailTransportSettings>;
}
export declare const buildSettingsUpdate: (existingRow: SettingsRow, body: SettingsUpdateInput) => Partial<SettingsInsert> | null;
export declare const buildApiKeysUpdate: (body: {
    geminiApiKey?: string;
    openaiApiKey?: string;
    claudeApiKey?: string;
    huggingfaceToken?: string;
    localModelEndpoint?: string;
    localModelName?: string;
    emailTransportPassword?: string;
}) => Partial<SettingsInsert>;
export {};
