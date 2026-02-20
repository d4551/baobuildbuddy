<script setup lang="ts">
import { APP_BRAND, APP_SEO } from "@bao/shared";
import { LOCAL_AI_DEFAULT_ENDPOINT, LOCAL_AI_DEFAULT_MODEL } from "@bao/shared";

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
type TestResult = { valid: boolean; provider: string };

const { updateProfile } = useUser();
const { settings, fetchSettings, updateApiKeys, testApiKey } = useSettings();
const router = useRouter();
const { $toast } = useNuxtApp();

const step = ref(1);
const name = ref("");
const currentRole = ref("");

const localModelEndpoint = ref(LOCAL_AI_DEFAULT_ENDPOINT);
const localModelName = ref(LOCAL_AI_DEFAULT_MODEL);
const geminiKey = ref("");
const openaiKey = ref("");
const claudeKey = ref("");
const huggingFaceToken = ref("");

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

function getProviderTestKey(provider: SetupProvider): string {
  if (provider === "local") {
    return localModelEndpoint.value.trim() || LOCAL_AI_DEFAULT_ENDPOINT;
  }

  if (provider === "gemini") return geminiKey.value.trim();
  if (provider === "openai") return openaiKey.value.trim();
  if (provider === "claude") return claudeKey.value.trim();
  return huggingFaceToken.value.trim();
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

async function handleTestProvider(provider: SetupProvider) {
  const key = getProviderTestKey(provider);
  if (!key && provider !== "local") return;

  testing.value = true;
  testingProvider.value = provider;
  testResults.value[provider] = null;
  try {
    const result = await testApiKey(provider, key);
    testResults.value[provider] = result;
    if (result?.valid) {
      $toast.success(`${provider.toUpperCase()} is reachable`);
    } else {
      $toast.error(`${provider.toUpperCase()} test failed`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to test provider";
    $toast.error(message);
    testResults.value[provider] = { valid: false, provider };
  } finally {
    testing.value = false;
    if (testingProvider.value === provider) {
      testingProvider.value = null;
    }
  }
}

async function handleComplete() {
  saving.value = true;
  try {
    if (name.value.trim()) {
      await updateProfile({
        name: name.value.trim(),
        currentRole: currentRole.value.trim() || undefined,
      });
    }

    const update: Record<string, string> = {
      localModelEndpoint: localModelEndpoint.value.trim() || LOCAL_AI_DEFAULT_ENDPOINT,
      localModelName: localModelName.value.trim() || LOCAL_AI_DEFAULT_MODEL,
    };

    if (geminiKey.value.trim()) update.geminiApiKey = geminiKey.value.trim();
    if (openaiKey.value.trim()) update.openaiApiKey = openaiKey.value.trim();
    if (claudeKey.value.trim()) update.claudeApiKey = claudeKey.value.trim();
    if (huggingFaceToken.value.trim()) update.huggingfaceToken = huggingFaceToken.value.trim();

    await updateApiKeys(update);

    $toast.success("Setup complete!");
    router.push("/");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete setup";
    $toast.error(message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h1 class="card-title text-2xl text-primary mb-4">Welcome to {{ APP_BRAND.name }}</h1>
      <ul class="steps steps-horizontal w-full mb-8">
        <li class="step" :class="{ 'step-primary': step >= 1 }" :data-content="step > 1 ? '✓' : '1'">Profile</li>
        <li class="step" :class="{ 'step-primary': step >= 2 }" :data-content="step > 2 ? '✓' : '2'">Local AI</li>
        <li class="step" :class="{ 'step-primary': step >= 3 }" :data-content="step >= 3 ? '✓' : '3'">Done</li>
      </ul>

      <!-- Step 1: Profile -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="text-lg font-semibold">Tell us about yourself</h2>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Your Name</legend>
          <input v-model="name" type="text" placeholder="Enter your name" class="input w-full" aria-label="Enter your name"/>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Current Role (optional)</legend>
          <input
            v-model="currentRole"
            type="text"
            placeholder="e.g. Game Designer, 3D Artist"
            class="input w-full"
            aria-label="e.g. Game Designer, 3D Artist"/>
        </fieldset>

        <div class="flex justify-end">
          <button class="btn btn-primary" @click="step = 2">Next</button>
        </div>
      </div>

      <!-- Step 2: Local-first AI setup -->
      <div v-if="step === 2" class="space-y-5">
        <h2 class="text-lg font-semibold">Configure AI (Local-first)</h2>
        <div role="alert" class="alert alert-info alert-soft">
          <span>
            {{ APP_BRAND.name }} prefers local providers first. Use RamaLama or Ollama for private, offline usage, and add cloud keys only if you want a backup.
          </span>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Local endpoint</legend>
          <input v-model="localModelEndpoint" type="text" class="input w-full" aria-label="Local Model Endpoint"/>
          <div class="label">Examples: RamaLama <code>/v1</code>, Ollama <code>/v1</code></div>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Local model name</legend>
          <input v-model="localModelName" type="text" class="input w-full" aria-label="Local Model Name"/>
        </fieldset>

        <button class="btn btn-outline btn-sm" :disabled="testing && testingProvider === 'local'" @click="handleTestProvider('local')">
          <span v-if="testing && testingProvider === 'local'" class="loading loading-spinner loading-xs"></span>
          Test Local Endpoint
        </button>

        <details class="collapse collapse-arrow bg-base-200">
          <summary class="collapse-title font-medium">Cloud providers (optional)</summary>
          <div class="collapse-content space-y-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Gemini API key</legend>
              <div class="join w-full">
                <input v-model="geminiKey" type="password" placeholder="Enter key" class="input join-item w-full" aria-label="Enter key"/>
                <button
                  class="btn btn-outline join-item"
                  :disabled="testing || !geminiKey.trim()"
                  @click="handleTestProvider('gemini')"
                >
                  Test
                </button>
              </div>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">OpenAI API key</legend>
              <div class="join w-full">
                <input v-model="openaiKey" type="password" placeholder="Enter key" class="input join-item w-full" aria-label="Enter key"/>
                <button
                  class="btn btn-outline join-item"
                  :disabled="testing || !openaiKey.trim()"
                  @click="handleTestProvider('openai')"
                >
                  Test
                </button>
              </div>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Claude API key</legend>
              <div class="join w-full">
                <input v-model="claudeKey" type="password" placeholder="Enter key" class="input join-item w-full" aria-label="Enter key"/>
                <button
                  class="btn btn-outline join-item"
                  :disabled="testing || !claudeKey.trim()"
                  @click="handleTestProvider('claude')"
                >
                  Test
                </button>
              </div>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Hugging Face token</legend>
              <div class="join w-full">
                <input v-model="huggingFaceToken" type="password" placeholder="Enter token" class="input join-item w-full" aria-label="Enter token"/>
                <button
                  class="btn btn-outline join-item"
                  :disabled="testing || !huggingFaceToken.trim()"
                  @click="handleTestProvider('huggingface')"
                >
                  Test
                </button>
              </div>
            </fieldset>
          </div>
        </details>

        <div class="flex justify-between">
          <button class="btn btn-ghost" @click="step = 1">Back</button>
          <button class="btn btn-primary" @click="step = 3">Next</button>
        </div>
      </div>

      <!-- Step 3: Complete -->
      <div v-if="step === 3" class="space-y-4 text-center">
        <div class="text-6xl mb-4">&#127918;</div>
        <h2 class="text-lg font-semibold">You’re all set!</h2>
        <p class="text-base-content/70">
          {{ APP_BRAND.assistantName }} is ready to help you with your game industry career.
        </p>

        <div class="flex justify-center gap-2">
          <button class="btn btn-ghost" @click="step = 2">Back</button>
          <button class="btn btn-primary" :disabled="saving" @click="handleComplete">
            <span v-if="saving" class="loading loading-spinner loading-xs"></span>
            Launch {{ APP_BRAND.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
