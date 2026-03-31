<script setup lang="ts">
import { APP_ROUTES, APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { getErrorMessage } from "~/utils/errors";
const {
  t,
  form,
  toneOptions,
  pendingAction,
  submitError,
  lastResult,
  scheduledRun,
  emailSettingsError,
  refreshEmailSettings,
  emailSettingsPending,
  emailDeliveryConfigured,
  pending,
  canSubmit,
  toLocalizedDateTime,
  resolveScheduledRunAt,
  submitEmailResponse,
  submitScheduledEmailResponse,
} = useAutomationEmailPage();

useSeoMeta({
  title: t("automation.email.title"),
  description: t("automation.email.pageDescription"),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="automation-email-title">
    <PageHeroHeader
      title-id="automation-email-title"
      :title="t('automation.email.title')"
      :description="t('automation.email.pageDescription')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automationRuns"
          class="btn btn-outline"
          :aria-label="t('automation.email.openRunsAria')"
        >
          {{ t("automation.email.openRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="emailSettingsPending" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="emailSettingsError"
      :message="getErrorMessage(emailSettingsError, t('automation.email.bootstrapError'))"
      :retry-label="t('automation.email.bootstrapRetry')"
      :retry-aria-label="t('automation.email.bootstrapRetryAria')"
      @retry="() => refreshEmailSettings()"
    />

    <div v-else class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.subjectLegend") }}</legend>
            <input
              v-model="form.subject"
              class="input w-full"
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
              class="input w-full"
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
              class="input w-full"
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
              class="select w-full"
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
              class="textarea min-h-36 w-full"
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
              <span class="label font-medium">
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

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.schedule.legend") }}</legend>
            <input
              v-model="form.runAt"
              class="input w-full"
              type="datetime-local"
              :aria-label="t('automation.email.schedule.aria')"
            />
            <p class="validator-hint">{{ t("automation.email.schedule.hint") }}</p>
          </fieldset>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <button
            class="btn btn-primary"
            :disabled="pending || !canSubmit"
            :aria-label="t('automation.email.generateAria')"
            @click="submitEmailResponse"
          >
            <span
              v-if="pendingAction === 'generate'"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>{{ t("automation.email.generateButton") }}</span>
          </button>
          <button
            class="btn btn-outline"
            :disabled="pending || !canSubmit || !form.runAt"
            :aria-label="t('automation.email.schedule.buttonAria')"
            @click="submitScheduledEmailResponse"
          >
            <span
              v-if="pendingAction === 'schedule'"
              class="loading loading-spinner loading-sm"
            ></span>
            <span v-else>{{ t("automation.email.schedule.button") }}</span>
          </button>
        </div>
      </div>
    </div>

    <BootstrapErrorAlert
      v-if="submitError"
      :title="t('automation.email.submitErrorTitle')"
      :message="submitError"
    />

    <div v-if="scheduledRun" class="card card-border bg-base-100 shadow-sm">
      <div class="card-body">
        <div role="alert" class="alert alert-info">
          <div>
            <h3 class="font-semibold">{{ t("automation.email.schedule.createdTitle") }}</h3>
            <p class="text-sm">{{ t("automation.email.runIdLabel", { id: scheduledRun.id }) }}</p>
            <p class="text-sm">
              {{
                t("automation.email.schedule.scheduledForLabel", {
                  date: toLocalizedDateTime(resolveScheduledRunAt(scheduledRun)),
                })
              }}
            </p>
            <p class="text-sm">
              {{ t("automation.email.schedule.statusLabel", { status: scheduledRun.status }) }}
            </p>
          </div>
        </div>

        <div class="card-actions justify-end">
          <NuxtLink
            :to="APP_ROUTE_BUILDERS.automationRunDetail(scheduledRun.id)"
            class="btn btn-ghost"
            :aria-label="t('automation.email.openRunDetailAria', { id: scheduledRun.id })"
          >
            {{ t("automation.email.openRunDetailButton") }}
          </NuxtLink>
        </div>
      </div>
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
            class="textarea w-full min-h-40"
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
