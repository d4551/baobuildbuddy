import type { AutomationSettings } from "@bao/shared";
import { AIService } from "../ai/ai-service";
import type { EmailTransportRuntimeConfig } from "../email-delivery-service";
export declare const loadAutomationSettings: () => Promise<AutomationSettings>;
export declare const resolveMaxConcurrentRuns: (settingsValue: AutomationSettings) => number;
export declare const tryLoadAIService: () => Promise<AIService | null>;
export declare const loadEmailTransportConfig: (missingSettingsMessage: string) => Promise<EmailTransportRuntimeConfig>;
export declare const normalizeScheduledRunAt: (runAt: string) => string;
