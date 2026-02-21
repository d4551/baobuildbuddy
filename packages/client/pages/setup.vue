<script setup lang="ts">
import {
  AI_PROVIDER_CATALOG,
  APP_BRAND,
  APP_ROUTES,
  APP_SEO,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  layout: "onboarding",
});

if (import.meta.server) {
  useServerSeoMeta({
    title: APP_SEO.setupTitle,
    description: APP_SEO.setupDescription,
  });
}

type SetupProvider = "local" | "gemini" | "openai" | "claude" | "huggingface";
type CloudProvider = Exclude<SetupProvider, "local">;
type TestResult = { valid: boolean; provider: string };
type SetupStep = 1 | 2 | 3;

const CLOUD_PROVIDER_IDS: readonly CloudProvider[] = ["gemini", "openai", "claude", "huggingface"];
const API_KEY_FIELD_BY_PROVIDER: Record<CloudProvider, string> = {
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
};
const isSetupProvider = (value: string): value is SetupProvider =>
  value === "local" ||
  value === "gemini" ||
  value === "openai" ||
  value === "claude" ||
  value === "huggingface";

const { t } = useI18n();
const { updateProfile } = useUser();
const { settings, fetchSettings, updateApiKeys, testApiKey } = useSettings();
const router = useRouter();
const { $toast } = useNuxtApp();

const step = ref<SetupStep>(1);
const name = ref("");
const currentRole = ref("");

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
  const map: Record<SetupProvider, string> = {
    local: "Local",
    gemini: "Gemini",
    openai: "OpenAI",
    claude: "Claude",
    huggingface: "Hugging Face",
  };

  for (const provider of AI_PROVIDER_CATALOG) {
    if (isSetupProvider(provider.id)) {
      map[provider.id] = provider.name;
    }
  }

  return map;
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

onMounted(async () => {
  await fetchSettings();

  if (settings.value?.localModelEndpoint) {
    localModelEndpoint.value = settings.value.localModelEndpoint;
  }
  if (settings.value?.localModelName) {
    localModelName.value = settings.value.localModelName;
  }
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

  if (trimmedName) {
    const profileUpdateResult = await settlePromise(
      updateProfile({
        name: trimmedName,
        ...(trimmedRole ? { currentRole: trimmedRole } : {}),
      }),
      t("setup.completeErrorFallback"),
    );
    if (!profileUpdateResult.ok) {
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
  router.push(APP_ROUTES.dashboard);
}
</script>

<template>
  <main aria-labelledby="setup-title">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 id="setup-title" class="card-title text-2xl text-primary mb-4">{{ t("setup.title", { brand: APP_BRAND.name }) }}</h1>
        <ul class="steps steps-horizontal w-full mb-8" :aria-label="t('setup.stepsAriaLabel')">
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
            <button class="btn btn-primary" :aria-label="t('setup.nextToLocalAiAria')" @click="step = 2">
              {{ t("setup.nextButton") }}
            </button>
          </div>
        </div>

        <div v-if="step === 2" class="space-y-5">
          <h2 class="text-lg font-semibold">{{ t("setup.aiConfigTitle") }}</h2>
          <div role="alert" class="alert alert-info alert-soft">
            <span>{{ t("setup.localFirstInfo", { brand: APP_BRAND.name }) }}</span>
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
            <span v-if="testing && testingProvider === 'local'" class="loading loading-spinner loading-xs"></span>
            {{ t("setup.testLocalButton") }}
          </button>

          <details class="collapse collapse-arrow bg-base-200">
            <summary class="collapse-title font-medium">{{ t("setup.cloudOptionalTitle") }}</summary>
            <div class="collapse-content space-y-4">
              <fieldset v-for="provider in CLOUD_PROVIDER_IDS" :key="provider" class="fieldset">
                <legend class="fieldset-legend">
                  {{ t("setup.cloudProviderLegend", { provider: getProviderLabel(provider) }) }}
                </legend>
                <div class="join w-full">
                  <input
                    v-model="providerCredentials[provider]"
                    type="password"
                    :placeholder="t('setup.cloudProviderPlaceholder', { provider: getProviderLabel(provider) })"
                    class="input join-item w-full"
                    :aria-label="t('setup.cloudProviderAria', { provider: getProviderLabel(provider) })"
                  />
                  <button
                    class="btn btn-outline join-item"
                    :disabled="testing || !providerCredentials[provider].trim()"
                    :aria-label="t('setup.testProviderAria', { provider: getProviderLabel(provider) })"
                    @click="handleTestProvider(provider)"
                  >
                    {{ t("setup.testButton") }}
                  </button>
                </div>
              </fieldset>
            </div>
          </details>

          <div class="flex justify-between">
            <button class="btn btn-ghost" :aria-label="t('setup.backToProfileAria')" @click="step = 1">
              {{ t("setup.backButton") }}
            </button>
            <button class="btn btn-primary" :aria-label="t('setup.nextToDoneAria')" @click="step = 3">
              {{ t("setup.nextButton") }}
            </button>
          </div>
        </div>

        <div v-if="step === 3" class="space-y-4 text-center">
          <div class="text-6xl mb-4" aria-hidden="true">{{ t("setup.successIconLabel") }}</div>
          <h2 class="text-lg font-semibold">{{ t("setup.doneTitle") }}</h2>
          <p class="text-base-content/70">
            {{ t("setup.doneDescription", { assistant: APP_BRAND.assistantName }) }}
          </p>

          <div class="flex justify-center gap-2">
            <button class="btn btn-ghost" :aria-label="t('setup.backToAiConfigAria')" @click="step = 2">
              {{ t("setup.backButton") }}
            </button>
            <button class="btn btn-primary" :disabled="saving" :aria-label="t('setup.launchAria')" @click="handleComplete">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ t("setup.launchButton", { brand: APP_BRAND.name }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
