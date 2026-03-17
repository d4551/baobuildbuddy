<script setup lang="ts">
import {
  AI_PROVIDER_CATALOG,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
  OLLAMA_WEBSITE_URL,
  type DashboardStats,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { createFlowEngineInput } from "~/constants/flow-engine";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  layout: "onboarding",
});

const { t } = useI18n();
const { resolvedBrand } = useBrand();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("setup.seoTitle", { brand: resolvedBrand.value.name }),
    description: t("setup.seoDescription"),
  });
}

type SetupProvider = "local" | "gemini" | "openai" | "claude" | "huggingface";
type CloudProvider = Exclude<SetupProvider, "local">;
type TestResult = { valid: boolean; provider: string };
type SetupStep = 1 | 2 | 3;
type SetupAuthStatus = {
  authRequired: boolean;
  configured: boolean;
  bootstrapRequired: boolean;
  setupTokenConfigured: boolean;
};

const CLOUD_PROVIDER_IDS: readonly CloudProvider[] = ["gemini", "openai", "claude", "huggingface"];
const API_KEY_FIELD_BY_PROVIDER: Record<CloudProvider, string> = {
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
};

const { updateProfile } = useUser();
const { settings, fetchSettings, updateApiKeys, testApiKey } = useSettings();
const { checkAuthStatus, initAuth, getStoredApiKey, setStoredApiKey } = useAuth();
const router = useRouter();
const api = useApi();
const { $toast } = useNuxtApp();
const dashboardStats = ref<DashboardStats | null>(null);

const step = ref<SetupStep>(1);
const name = ref("");
const currentRole = ref("");
const authStatus = ref<SetupAuthStatus | null>(null);
const authSetupToken = ref("");
const existingApiKey = ref("");

const localModelEndpoint = ref(LOCAL_AI_DEFAULT_ENDPOINT);
const localModelName = ref(LOCAL_AI_DEFAULT_MODEL);
const providerCredentials = reactive<Record<CloudProvider, string>>({
  gemini: "",
  openai: "",
  claude: "",
  huggingface: "",
});

const testing = ref(false);
const saving = ref(false);
const testingProvider = ref<SetupProvider | null>(null);
const testResults = ref<Record<SetupProvider, TestResult | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const providerNameById = computed<Record<SetupProvider, string>>(() => {
  const catalogMap = new Map(
    AI_PROVIDER_CATALOG.map((provider) => [provider.id, provider] as const),
  );

  const resolveProviderName = (providerId: SetupProvider): string => {
    const provider = catalogMap.get(providerId);
    if (!provider) {
      return providerId;
    }
    return t(provider.nameKey);
  };

  return {
    local: resolveProviderName("local"),
    gemini: resolveProviderName("gemini"),
    openai: resolveProviderName("openai"),
    claude: resolveProviderName("claude"),
    huggingface: resolveProviderName("huggingface"),
  };
});

function getProviderLabel(provider: SetupProvider): string {
  return providerNameById.value[provider];
}

function getProviderTestKey(provider: SetupProvider): string {
  if (provider === "local") {
    return localModelEndpoint.value.trim() || LOCAL_AI_DEFAULT_ENDPOINT;
  }

  return providerCredentials[provider].trim();
}

await useAsyncData(
  "setup-bootstrap",
  async () => {
    const settingsResult = await settlePromise(
      fetchSettings(),
      t("apiErrors.settings.fetchFailed"),
    );
    if (settingsResult.ok && settings.value) {
      if (settings.value.localModelEndpoint) {
        localModelEndpoint.value = settings.value.localModelEndpoint;
      }
      if (settings.value.localModelName) {
        localModelName.value = settings.value.localModelName;
      }
    }

    const statsResult = await settlePromise(
      api.stats.dashboard.get(),
      t("apiErrors.statistics.fetchDashboardFailed"),
    );
    if (statsResult.ok && !statsResult.value.error) {
      dashboardStats.value = statsResult.value.data;
    } else {
      dashboardStats.value = null;
    }

    const authStatusResult = await settlePromise(checkAuthStatus(), t("apiErrors.auth.initFailed"));
    authStatus.value = authStatusResult.ok ? authStatusResult.value : null;

    return {
      initialized: true,
    };
  },
  {
    server: true,
    lazy: false,
  },
);

const setupCompletionFlowInput = computed(() =>
  createFlowEngineInput(dashboardStats.value, {
    isProfileComplete: true,
    isSetupComplete: true,
  }),
);
const { primaryAction: setupCompletionPrimaryAction } = useFlowEngine(setupCompletionFlowInput);
const postSetupFlowTarget = computed(() => setupCompletionPrimaryAction.value.to);
const authBootstrapRequired = computed(
  () => authStatus.value?.authRequired === true && authStatus.value.bootstrapRequired,
);
const authSetupTokenConfigured = computed(() => authStatus.value?.setupTokenConfigured === true);
const needsStoredApiKey = computed(
  () =>
    authStatus.value?.authRequired === true &&
    authStatus.value.bootstrapRequired === false &&
    getStoredApiKey() === null,
);
const ollamaCommand = computed(() => {
  const modelName = localModelName.value.trim() || LOCAL_AI_DEFAULT_MODEL;
  return `ollama run ${modelName}`;
});

async function handleTestProvider(provider: SetupProvider): Promise<void> {
  const key = getProviderTestKey(provider);
  if (!key && provider !== "local") {
    return;
  }

  testing.value = true;
  testingProvider.value = provider;
  testResults.value[provider] = null;
  const providerTestResult = await settlePromise(
    testApiKey(provider, key),
    t("setup.providerTestErrorFallback"),
  );
  testing.value = false;
  if (testingProvider.value === provider) {
    testingProvider.value = null;
  }

  if (!providerTestResult.ok) {
    $toast.error(getErrorMessage(providerTestResult.error, t("setup.providerTestErrorFallback")));
    testResults.value[provider] = { valid: false, provider };
    return;
  }

  const result = providerTestResult.value;
  testResults.value[provider] = result;
  if (result?.valid) {
    $toast.success(t("setup.providerReachable", { provider: getProviderLabel(provider) }));
  } else {
    $toast.error(t("setup.providerTestFailed", { provider: getProviderLabel(provider) }));
  }
}

async function handleComplete(): Promise<void> {
  saving.value = true;
  const trimmedName = name.value.trim();
  const trimmedRole = currentRole.value.trim();
  const setupToken = authSetupToken.value.trim();
  const providedApiKey = existingApiKey.value.trim();
  const storedApiKey = getStoredApiKey();

  const nextAuthStatus = authStatus.value ?? (await checkAuthStatus());
  authStatus.value = nextAuthStatus;
  if (nextAuthStatus.authRequired && !storedApiKey) {
    if (nextAuthStatus.bootstrapRequired) {
      if (!nextAuthStatus.setupTokenConfigured) {
        saving.value = false;
        $toast.error(t("setup.auth.bootstrapUnavailableDescription"));
        return;
      }

      if (!setupToken) {
        saving.value = false;
        $toast.error(t("setup.auth.setupTokenRequiredError"));
        return;
      }

      const authInitResult = await settlePromise(
        initAuth(setupToken),
        t("apiErrors.auth.initFailed"),
      );
      if (!authInitResult.ok) {
        saving.value = false;
        $toast.error(getErrorMessage(authInitResult.error, t("apiErrors.auth.initFailed")));
        return;
      }

      const issuedApiKey = authInitResult.value.apiKey;
      if (typeof issuedApiKey !== "string" || issuedApiKey.length === 0) {
        saving.value = false;
        $toast.error(t("apiErrors.auth.initFailed"));
        return;
      }

      setStoredApiKey(issuedApiKey);
    } else {
      if (!providedApiKey) {
        saving.value = false;
        $toast.error(t("setup.auth.apiKeyRequiredError"));
        return;
      }

      setStoredApiKey(providedApiKey);
    }
  }

  const activeApiKey = getStoredApiKey();
  if (nextAuthStatus.authRequired && !activeApiKey) {
    saving.value = false;
    $toast.error(t("apiErrors.auth.initFailed"));
    return;
  }

  if (trimmedName) {
    const profileUpdateResult = await settlePromise(
      updateProfile({
        name: trimmedName,
        ...(trimmedRole ? { currentRole: trimmedRole } : {}),
      }),
      t("setup.completeErrorFallback"),
    );
    if (!profileUpdateResult.ok) {
      if (!storedApiKey && providedApiKey.length > 0) {
        setStoredApiKey(null);
      }
      saving.value = false;
      $toast.error(getErrorMessage(profileUpdateResult.error, t("setup.completeErrorFallback")));
      return;
    }
  }

  const update: Record<string, string> = {
    localModelEndpoint: localModelEndpoint.value.trim() || LOCAL_AI_DEFAULT_ENDPOINT,
    localModelName: localModelName.value.trim() || LOCAL_AI_DEFAULT_MODEL,
  };

  for (const provider of CLOUD_PROVIDER_IDS) {
    const credential = providerCredentials[provider].trim();
    if (credential) {
      update[API_KEY_FIELD_BY_PROVIDER[provider]] = credential;
    }
  }

  const apiKeyUpdateResult = await settlePromise(
    updateApiKeys(update),
    t("setup.completeErrorFallback"),
  );
  saving.value = false;
  if (!apiKeyUpdateResult.ok) {
    $toast.error(getErrorMessage(apiKeyUpdateResult.error, t("setup.completeErrorFallback")));
    return;
  }

  $toast.success(t("setup.completeToast"));
  await router.push(postSetupFlowTarget.value);
}

async function copyOllamaCommand(): Promise<void> {
  if (!import.meta.client) {
    return;
  }

  const clipboardWriteResult = await settlePromise(
    navigator.clipboard.writeText(ollamaCommand.value),
    t("setup.ollamaCommandCopyFailed"),
  );
  if (!clipboardWriteResult.ok) {
    $toast.error(getErrorMessage(clipboardWriteResult.error, t("setup.ollamaCommandCopyFailed")));
    return;
  }

  $toast.success(t("setup.ollamaCommandCopied"));
}
</script>

<template>
  <PageScaffold tag="main" width-token="narrow" labelled-by="setup-title">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 id="setup-title" class="card-title text-2xl text-primary mb-4">
          {{ t("setup.title", { brand: resolvedBrand.name }) }}
        </h1>
        <ul
          class="steps steps-horizontal w-full mb-8"
          :aria-label="t('setup.stepsAriaLabel')"
        >
          <li
            class="step"
            :class="{ 'step-primary': step >= 1 }"
            :data-content="step > 1 ? '✓' : '1'"
          >
            {{ t("setup.steps.profile") }}
          </li>
          <li
            class="step"
            :class="{ 'step-primary': step >= 2 }"
            :data-content="step > 2 ? '✓' : '2'"
          >
            {{ t("setup.steps.localAi") }}
          </li>
          <li
            class="step"
            :class="{ 'step-primary': step >= 3 }"
            :data-content="step >= 3 ? '✓' : '3'"
          >
            {{ t("setup.steps.done") }}
          </li>
        </ul>

        <div v-if="step === 1" class="space-y-4">
          <h2 class="text-lg font-semibold">{{ t("setup.profileTitle") }}</h2>
          <label class="floating-label w-full">
            <span>{{ t("setup.nameLegend") }}</span>
            <input
              v-model="name"
              type="text"
              :placeholder="t('setup.namePlaceholder')"
              class="input w-full"
              :aria-label="t('setup.nameAria')"
            />
          </label>
          <label class="floating-label w-full">
            <span>{{ t("setup.currentRoleLegend") }}</span>
            <input
              v-model="currentRole"
              type="text"
              :placeholder="t('setup.currentRolePlaceholder')"
              class="input w-full"
              :aria-label="t('setup.currentRoleAria')"
            />
          </label>

          <div class="flex justify-end">
            <button
              class="btn btn-primary"
              :aria-label="t('setup.nextToLocalAiAria')"
              @click="step = 2"
            >
              {{ t("setup.nextButton") }}
            </button>
          </div>
        </div>

        <div v-if="step === 2" class="space-y-5">
          <h2 class="text-lg font-semibold">{{ t("setup.aiConfigTitle") }}</h2>
          <div role="alert" class="alert alert-info alert-soft">
            <span>{{
              t("setup.localFirstInfo", { brand: resolvedBrand.name })
            }}</span>
          </div>

          <div
            role="alert"
            class="alert alert-info alert-soft alert-vertical sm:alert-horizontal items-start"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 mt-1 shrink-0 stroke-current text-info"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1 w-full overflow-hidden">
              <h3 class="font-semibold mb-1">
                {{ t("settings.aiProviders.ollamaTipTitle") }}
              </h3>
              <p class="text-sm mb-3">
                {{ t("settings.aiProviders.ollamaTipDescription") }}
                <NuxtLink
                  :to="OLLAMA_WEBSITE_URL"
                  target="_blank"
                  class="link link-primary inline-flex items-center gap-1"
                  :aria-label="t('settings.aiProviders.ollamaTipLinkAria')"
                >
                  {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </NuxtLink>
              </p>

              <div class="relative w-full mt-2 group rounded-box bg-base-300 text-base-content overflow-hidden border border-base-200">
                <div class="overflow-x-auto p-3 pr-14 text-sm font-mono whitespace-nowrap">
                  <span class="text-base-content/50 mr-2">$</span>{{ ollamaCommand }}
                </div>
                <button
                  class="btn btn-sm btn-square btn-ghost absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-base-300/80 backdrop-blur-sm"
                  type="button"
                  :aria-label="t('setup.ollamaCommandCopyAria')"
                  :title="t('setup.ollamaCommandCopyTitle')"
                  @click="copyOllamaCommand"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          </div>

          <label class="floating-label w-full">
            <span>{{ t("setup.localEndpointLegend") }}</span>
            <input
              v-model="localModelEndpoint"
              type="text"
              class="input w-full"
              :aria-label="t('setup.localEndpointAria')"
            />
          </label>
          <div class="label">{{ t("setup.localEndpointExamples") }}</div>

          <label class="floating-label w-full">
            <span>{{ t("setup.localModelLegend") }}</span>
            <input
              v-model="localModelName"
              type="text"
              class="input w-full"
              :aria-label="t('setup.localModelAria')"
            />
          </label>

          <button
            class="btn btn-outline btn-sm"
            :disabled="testing && testingProvider === 'local'"
            :aria-label="t('setup.testLocalAria')"
            @click="handleTestProvider('local')"
          >
            <span
              v-if="testing && testingProvider === 'local'"
              class="loading loading-spinner loading-xs"
            ></span>
            {{ t("setup.testLocalButton") }}
          </button>

          <details class="collapse collapse-arrow bg-base-200">
            <summary class="collapse-title font-medium">
              {{ t("setup.cloudOptionalTitle") }}
            </summary>
            <div class="collapse-content space-y-4">
              <fieldset
                v-for="provider in CLOUD_PROVIDER_IDS"
                :key="provider"
                class="fieldset"
              >
                <legend class="fieldset-legend">
                  {{
                    t("setup.cloudProviderLegend", {
                      provider: getProviderLabel(provider),
                    })
                  }}
                </legend>
                <div class="join w-full">
                  <input
                    v-model="providerCredentials[provider]"
                    type="password"
                    :placeholder="
                      t('setup.cloudProviderPlaceholder', {
                        provider: getProviderLabel(provider),
                      })
                    "
                    class="input join-item w-full"
                    :aria-label="
                      t('setup.cloudProviderAria', {
                        provider: getProviderLabel(provider),
                      })
                    "
                  />
                  <button
                    class="btn btn-outline join-item"
                    :disabled="testing || !providerCredentials[provider].trim()"
                    :aria-label="
                      t('setup.testProviderAria', {
                        provider: getProviderLabel(provider),
                      })
                    "
                    @click="handleTestProvider(provider)"
                  >
                    {{ t("setup.testButton") }}
                  </button>
                </div>
              </fieldset>
            </div>
          </details>

          <div class="flex justify-between">
            <button
              class="btn btn-ghost"
              :aria-label="t('setup.backToProfileAria')"
              @click="step = 1"
            >
              {{ t("setup.backButton") }}
            </button>
            <button
              class="btn btn-primary"
              :aria-label="t('setup.nextToDoneAria')"
              @click="step = 3"
            >
              {{ t("setup.nextButton") }}
            </button>
          </div>
        </div>

        <div v-if="step === 3" class="space-y-4 text-center">
          <div class="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="h-14 w-14 text-success"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.5 2.5 2.5 4.5-5" />
            </svg>
            <span class="sr-only">{{ t("setup.successStatusAria") }}</span>
          </div>
          <h2 class="text-lg font-semibold">{{ t("setup.doneTitle") }}</h2>
          <p class="text-base-content/70">
            {{
              t("setup.doneDescription", {
                assistant: resolvedBrand.assistantName,
              })
            }}
          </p>

          <div
            v-if="authBootstrapRequired && authSetupTokenConfigured"
            role="alert"
            class="alert alert-info alert-vertical text-left sm:alert-horizontal"
          >
            <div>
              <h3 class="font-bold">{{ t("setup.auth.setupTokenTitle") }}</h3>
              <div class="text-sm">{{ t("setup.auth.setupTokenDescription") }}</div>
            </div>
          </div>

          <div
            v-else-if="authBootstrapRequired"
            role="alert"
            class="alert alert-warning alert-vertical text-left sm:alert-horizontal"
          >
            <div>
              <h3 class="font-bold">{{ t("setup.auth.bootstrapUnavailableTitle") }}</h3>
              <div class="text-sm">{{ t("setup.auth.bootstrapUnavailableDescription") }}</div>
            </div>
          </div>

          <label v-if="authBootstrapRequired && authSetupTokenConfigured" class="floating-label w-full text-left">
            <span>{{ t("setup.auth.setupTokenLegend") }}</span>
            <input
              v-model="authSetupToken"
              type="password"
              :placeholder="t('setup.auth.setupTokenPlaceholder')"
              class="input w-full"
              :aria-label="t('setup.auth.setupTokenAria')"
            />
          </label>

          <label v-if="needsStoredApiKey" class="floating-label w-full text-left">
            <span>{{ t("setup.auth.apiKeyLegend") }}</span>
            <input
              v-model="existingApiKey"
              type="password"
              :placeholder="t('setup.auth.apiKeyPlaceholder')"
              class="input w-full"
              :aria-label="t('setup.auth.apiKeyAria')"
            />
          </label>

          <div class="flex justify-center gap-2">
            <button
              class="btn btn-ghost"
              :aria-label="t('setup.backToAiConfigAria')"
              @click="step = 2"
            >
              {{ t("setup.backButton") }}
            </button>
            <button
              class="btn btn-primary"
              :disabled="saving"
              :aria-label="t('setup.launchAria')"
              @click="handleComplete"
            >
              <span
                v-if="saving"
                class="loading loading-spinner loading-xs"
              ></span>
              {{ t("setup.launchButton", { brand: resolvedBrand.name }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
