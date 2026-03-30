import type { ComputedRef, Ref } from "vue";
import type {
  CloudProvider,
  SetupAuthStatus,
  SetupProvider,
  SetupTestResult,
} from "~/components/setup/setup-page-contracts";
import type { LocalProviderState } from "~/utils/ai-control-plane";

export type ProviderCredentialState = Record<CloudProvider, string>;
export interface SetupPageToastApi {
  error: (message: string) => void;
  success: (message: string) => void;
}
export interface ProfileUpdatePayload { name: string; currentRole?: string }

export interface SettingsSnapshot {
  hasGeminiKey?: boolean | null;
  hasOpenaiKey?: boolean | null;
  hasClaudeKey?: boolean | null;
  hasHuggingfaceToken?: boolean | null;
}

export interface SetupPageActionsContext {
  authSetupToken: Ref<string>;
  authStatus: Ref<SetupAuthStatus | null>;
  checkAuthStatus: () => Promise<SetupAuthStatus>;
  currentRole: Ref<string>;
  existingApiKey: Ref<string>;
  getStoredApiKey: () => string | null;
  initAuth: (setupToken?: string) => Promise<{ apiKey?: string }>;
  localModelEndpoint: Ref<string>;
  localModelName: Ref<string>;
  localProviderState: ComputedRef<LocalProviderState>;
  name: Ref<string>;
  ollamaCommand: ComputedRef<string>;
  postSetupFlowTarget: ComputedRef<string>;
  providerCredentials: ProviderCredentialState;
  providerLabels: ComputedRef<Record<SetupProvider, string>>;
  router: { push: (to: string) => Promise<unknown> };
  saving: Ref<boolean>;
  setStoredApiKey: (apiKey: string | null) => void;
  settings: Ref<SettingsSnapshot | null>;
  t: (key: string, values?: Record<string, string | number>) => string;
  testApiKey: (provider: SetupProvider, key: string, model?: string) => Promise<SetupTestResult>;
  testResults: Ref<Record<SetupProvider, SetupTestResult | null>>;
  testing: Ref<boolean>;
  testingProvider: Ref<SetupProvider | null>;
  toast: SetupPageToastApi;
  updateApiKeys: (update: Record<string, string>) => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<void>;
}

export interface SetupCompletionInput {
  providedApiKey: string;
  setupToken: string;
  storedApiKey: string | null;
  trimmedName: string;
  trimmedRole: string;
}
