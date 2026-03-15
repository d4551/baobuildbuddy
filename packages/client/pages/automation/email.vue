<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  APP_ROUTES,
  isEmailTransportConfigured,
  isValidEmail,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

type EmailResponseTone = "professional" | "friendly" | "concise";

interface EmailFormState {
  subject: string;
  message: string;
  sender: string;
  tone: EmailResponseTone;
  recipientEmail: string;
  deliverAfterGeneration: boolean;
}

const { t } = useI18n();
const { triggerEmailResponse } = useAutomation();
const { settings, fetchSettings } = useSettings();

const toneOptions: readonly EmailResponseTone[] = ["professional", "friendly", "concise"] as const;

const form = reactive<EmailFormState>({
  subject: "",
  message: "",
  sender: "",
  tone: "professional",
  recipientEmail: "",
  deliverAfterGeneration: false,
});

const pending = ref(false);
const submitError = ref("");
const lastResult = ref<{
  runId: string;
  reply: string;
  provider: string;
  model: string;
  delivered: boolean;
  recipientEmail?: string;
  deliveredAt?: string;
  messageId?: string;
} | null>(null);

await useAsyncData("automation-email-settings", async () => {
  if (!settings.value) {
    await fetchSettings();
  }
  return true;
});

const emailDeliveryConfigured = computed(() =>
  isEmailTransportConfigured(
    settings.value?.emailTransportSettings,
    settings.value?.hasEmailTransportPassword ?? false,
  ),
);

const resolvedRecipientEmail = computed(() => {
  const explicitRecipient = form.recipientEmail.trim();
  if (explicitRecipient.length > 0) {
    return explicitRecipient;
  }

  const sender = form.sender.trim();
  return isValidEmail(sender) ? sender : "";
});

async function submitEmailResponse(): Promise<void> {
  submitError.value = "";
  lastResult.value = null;

  if (form.deliverAfterGeneration) {
    if (!emailDeliveryConfigured.value) {
      submitError.value = t("automation.email.deliveryUnavailableDescription");
      return;
    }

    if (!isValidEmail(resolvedRecipientEmail.value)) {
      submitError.value = t("automation.email.invalidRecipient");
      return;
    }
  }

  pending.value = true;

  const responseResult = await settlePromise(
    triggerEmailResponse({
      subject: form.subject.trim(),
      message: form.message.trim(),
      tone: form.tone,
      ...(form.sender.trim() ? { sender: form.sender.trim() } : {}),
      ...(resolvedRecipientEmail.value ? { recipientEmail: resolvedRecipientEmail.value } : {}),
      deliverAfterGeneration: form.deliverAfterGeneration,
    }),
    t("automation.email.submitErrorFallback"),
  );
  pending.value = false;

  if (!responseResult.ok) {
    submitError.value = getErrorMessage(
      responseResult.error,
      t("automation.email.submitErrorFallback"),
    );
    return;
  }

  const response = responseResult.value;
  lastResult.value = {
    runId: response.runId,
    reply: response.reply,
    provider: response.provider,
    model: response.model,
    delivered: response.delivered,
    recipientEmail: response.recipientEmail,
    deliveredAt: response.deliveredAt,
    messageId: response.messageId,
  };
}

if (import.meta.server) {
  useServerSeoMeta({
    title: t("automation.email.title"),
    description: t("automation.email.pageDescription"),
  });
}
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-email-title">
    <PageHeaderBlock title-id="automation-email-title" :title="t('automation.email.title')">
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automationRuns"
          class="btn btn-outline"
          :aria-label="t('automation.email.openRunsAria')"
        >
          {{ t("automation.email.openRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeaderBlock>

    <div class="card card-border bg-base-100 shadow-sm">
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
            <p class="validator-hint">{{ t("automation.email.senderHint") }}</p>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.recipientLegend") }}</legend>
            <input
              v-model="form.recipientEmail"
              class="input input-bordered w-full"
              type="email"
              maxlength="320"
              :placeholder="t('automation.email.recipientPlaceholder')"
              :aria-label="t('automation.email.recipientAria')"
            />
            <p class="validator-hint">{{ t("automation.email.recipientHint") }}</p>
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

          <div class="rounded-box border border-base-300 bg-base-200/60 p-4">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="form.deliverAfterGeneration"
                type="checkbox"
                class="checkbox checkbox-primary"
                :disabled="!emailDeliveryConfigured"
                :aria-label="t('automation.email.deliverAria')"
              />
              <span class="label-text font-medium">
                {{ t("automation.email.deliverLabel") }}
              </span>
            </label>
            <p class="mt-2 text-sm text-base-content/70">
              {{
                emailDeliveryConfigured
                  ? t("automation.email.deliveryConfiguredDescription")
                  : t("automation.email.deliveryUnavailableDescription")
              }}
            </p>
            <NuxtLink
              v-if="!emailDeliveryConfigured"
              :to="APP_ROUTES.settings"
              class="btn btn-link btn-sm px-0"
              :aria-label="t('automation.email.configureDeliveryAria')"
            >
              {{ t("automation.email.configureDeliveryButton") }}
            </NuxtLink>
          </div>
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

    <div v-if="submitError" role="alert" class="alert alert-error">
      <h3 class="font-semibold">{{ t("automation.email.submitErrorTitle") }}</h3>
      <p>{{ submitError }}</p>
    </div>

    <div v-if="lastResult" class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <div role="alert" class="alert alert-success">
          <div>
            <h3 class="font-semibold">
              {{
                lastResult.delivered
                  ? t("automation.email.deliveredTitle")
                  : t("automation.email.generatedTitle")
              }}
            </h3>
            <p class="text-sm">{{ t("automation.email.generatedProvider", { provider: lastResult.provider, model: lastResult.model }) }}</p>
            <p class="text-sm">{{ t("automation.email.runIdLabel", { id: lastResult.runId }) }}</p>
            <p v-if="lastResult.recipientEmail" class="text-sm">
              {{ t("automation.email.recipientLabel", { email: lastResult.recipientEmail }) }}
            </p>
            <p v-if="lastResult.messageId" class="text-sm">
              {{ t("automation.email.messageIdLabel", { id: lastResult.messageId }) }}
            </p>
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
  </PageScaffold>
</template>
