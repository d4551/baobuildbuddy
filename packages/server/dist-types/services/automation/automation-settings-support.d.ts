import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import { AIService } from "../ai/ai-service";
import type { EmailTransportRuntimeConfig } from "../email-delivery-service";
type SettingsAutomationRow = {
    id: string;
    automationSettings: AutomationSettings | null;
};
export declare const normalizeAndPersistAutomationSettings: (row: SettingsAutomationRow) => Promise<AutomationSettings | null>;
export declare const loadAutomationSettings: () => Promise<AutomationSettings>;
/**
 * Resolve automation script timeout in ms from settings (legacy 30s normalized).
 */
export declare const resolveAutomationTimeoutMs: (settingsValue: AutomationSettings) => number;
export declare const resolveMaxConcurrentRuns: (settingsValue: AutomationSettings) => number;
export declare const tryLoadAIService: () => Promise<AIService | null>;
export declare const loadEmailTransportConfig: (missingSettingsMessage: string) => Promise<EmailTransportRuntimeConfig>;
export declare const normalizeScheduledRunAt: (runAt: string) => string;
export {};
