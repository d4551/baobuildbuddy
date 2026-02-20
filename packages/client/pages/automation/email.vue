<script setup lang="ts">
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

type EmailResponseTone = "professional" | "friendly" | "concise";

interface EmailFormState {
  subject: string;
  message: string;
  sender: string;
  tone: EmailResponseTone;
}

const { t } = useI18n();
const { triggerEmailResponse } = useAutomation();

const toneOptions: readonly EmailResponseTone[] = ["professional", "friendly", "concise"] as const;

const form = reactive<EmailFormState>({
  subject: "",
  message: "",
  sender: "",
  tone: "professional",
});

const pending = ref(false);
const submitError = ref("");
const lastResult = ref<{
  runId: string;
  reply: string;
  provider: string;
  model: string;
} | null>(null);

async function submitEmailResponse(): Promise<void> {
  submitError.value = "";
  lastResult.value = null;
  pending.value = true;

  try {
    const response = await triggerEmailResponse({
      subject: form.subject.trim(),
      message: form.message.trim(),
      tone: form.tone,
      ...(form.sender.trim() ? { sender: form.sender.trim() } : {}),
    });

    lastResult.value = {
      runId: response.runId,
      reply: response.reply,
      provider: response.provider,
      model: response.model,
    };
  } catch (error) {
    submitError.value = getErrorMessage(error, t("automation.email.submitErrorFallback"));
  } finally {
    pending.value = false;
  }
}

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.email.title"),
    description: t("automation.email.pageDescription"),
  });
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-3">
      <h1 class="text-3xl font-bold">{{ t("automation.email.title") }}</h1>
      <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-outline" :aria-label="t('automation.email.openRunsAria')">
        {{ t("automation.email.openRunsButton") }}
      </NuxtLink>
    </div>

    <div class="card bg-base-100 max-w-3xl shadow-sm">
      <div class="card-body">
        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.subjectLegend") }}</legend>
            <input
              v-model="form.subject"
              class="input input-bordered w-full"
              type="text"
              required
              minlength="3"
              maxlength="200"
              :placeholder="t('automation.email.subjectPlaceholder')"
              :aria-label="t('automation.email.subjectAria')"
            />
            <p class="validator-hint">{{ t("automation.email.subjectHint") }}</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.senderLegend") }}</legend>
            <input
              v-model="form.sender"
              class="input input-bordered w-full"
              type="text"
              maxlength="200"
              :placeholder="t('automation.email.senderPlaceholder')"
              :aria-label="t('automation.email.senderAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.toneLegend") }}</legend>
            <select
              v-model="form.tone"
              class="select select-bordered w-full"
              :aria-label="t('automation.email.toneAria')"
            >
              <option v-for="tone in toneOptions" :key="tone" :value="tone">
                {{ t(`automation.email.tones.${tone}`) }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.messageLegend") }}</legend>
            <textarea
              v-model="form.message"
              class="textarea textarea-bordered min-h-36 w-full"
              required
              minlength="10"
              maxlength="12000"
              :placeholder="t('automation.email.messagePlaceholder')"
              :aria-label="t('automation.email.messageAria')"
            />
            <p class="validator-hint">{{ t("automation.email.messageHint") }}</p>
          </fieldset>
        </div>

        <div class="mt-6">
          <button
            class="btn btn-primary"
            :disabled="pending || !form.subject.trim() || !form.message.trim()"
            :aria-label="t('automation.email.generateAria')"
            @click="submitEmailResponse"
          >
            <span v-if="pending" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ t("automation.email.generateButton") }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitError" role="alert" class="alert alert-error mt-6">
      <h3 class="font-semibold">{{ t("automation.email.submitErrorTitle") }}</h3>
      <p>{{ submitError }}</p>
    </div>

    <div v-if="lastResult" class="card bg-base-100 shadow-sm mt-6">
      <div class="card-body">
        <div role="alert" class="alert alert-success">
          <div>
            <h3 class="font-semibold">{{ t("automation.email.generatedTitle") }}</h3>
            <p class="text-sm">{{ t("automation.email.generatedProvider", { provider: lastResult.provider, model: lastResult.model }) }}</p>
            <p class="text-sm">{{ t("automation.email.runIdLabel", { id: lastResult.runId }) }}</p>
          </div>
        </div>

        <fieldset class="fieldset mt-4">
          <legend class="fieldset-legend">{{ t("automation.email.replyLegend") }}</legend>
          <textarea
            class="textarea textarea-bordered w-full min-h-40"
            readonly
            :value="lastResult.reply"
            :aria-label="t('automation.email.replyAria')"
          />
        </fieldset>

        <div class="card-actions justify-end">
          <NuxtLink
            :to="APP_ROUTE_BUILDERS.automationRunDetail(lastResult.runId)"
            class="btn btn-ghost"
            :aria-label="t('automation.email.openRunDetailAria', { id: lastResult.runId })"
          >
            {{ t("automation.email.openRunDetailButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
