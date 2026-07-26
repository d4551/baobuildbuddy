<script setup lang="ts">
import AppProseField from "~/components/ui/AppProseField.vue";
import {
  CHECKBOX_CONTROL_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  MARGIN_TOKEN_CLASS,
  MIN_H_36_CLASS,
  MIN_HEIGHT_SCROLL_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { LOADING_SKELETON_LINES } from "~/constants/numeric-ui";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";
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
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('automation.email.openRunsAria')"
        >
          {{ t("automation.email.openRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="emailSettingsPending" :lines="LOADING_SKELETON_LINES.long" />

    <BootstrapErrorAlert
      v-else-if="emailSettingsError"
      :message="getErrorMessage(emailSettingsError, t('automation.email.bootstrapError'))"
      :retry-label="t('automation.email.bootstrapRetry')"
      :retry-aria-label="t('automation.email.bootstrapRetryAria')"
      @retry="() => refreshEmailSettings()"
    />

    <div v-else :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.subjectLegend") }}</legend>
            <input
              v-model="form.subject"
              class="input" :class="[FLUID_WIDTH_CLASS]"
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
              class="input" :class="[FLUID_WIDTH_CLASS]"
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
              class="input" :class="[FLUID_WIDTH_CLASS]"
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
              class="select" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('automation.email.toneAria')"
            >
              <option v-for="tone in toneOptions" :key="tone" :value="tone">
                {{ t(`automation.email.tones.${tone}`) }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.messageLegend") }}</legend>
            <AppProseField
              v-model="form.message"
              :min-height-class="MIN_H_36_CLASS"
              :placeholder="t('automation.email.messagePlaceholder')"
              :aria-label="t('automation.email.messageAria')"
            />
            <p class="validator-hint">{{ t("automation.email.messageHint") }}</p>
          </fieldset>

          <div class="rounded-box border border-base-300" :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p4]">
            <label class="label cursor-pointer justify-start" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <input
                v-model="form.deliverAfterGeneration"
                type="checkbox"
                :class="[CHECKBOX_CONTROL_CLASS]"
                :disabled="!emailDeliveryConfigured"
                :aria-label="t('automation.email.deliverAria')"
              />
              <span class="label font-medium">
                {{ t("automation.email.deliverLabel") }}
              </span>
            </label>
            <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">
              {{
                emailDeliveryConfigured
                  ? t("automation.email.deliveryConfiguredDescription")
                  : t("automation.email.deliveryUnavailableDescription")
              }}
            </p>
            <NuxtLink
              v-if="!emailDeliveryConfigured"
              :to="APP_ROUTE_BUILDERS.settingsSection('emailDelivery')"
              :class="[PRIMARY_ACTION_CLASS]"
              :aria-label="t('automation.email.configureDeliveryAria')"
            >
              {{ t("automation.email.configureDeliveryButton") }}
            </NuxtLink>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.email.schedule.legend") }}</legend>
            <input
              v-model="form.runAt"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="datetime-local"
              :aria-label="t('automation.email.schedule.aria')"
            />
            <p class="validator-hint">{{ t("automation.email.schedule.hint") }}</p>
          </fieldset>
        </div>

        <div class="flex flex-wrap" :class="[MARGIN_TOKEN_CLASS.mt6, FLEX_GAP_TOKEN_CLASS.gap3]">
          <button type="button"
            :class="[PRIMARY_ACTION_CLASS]"
            :disabled="pending || !canSubmit"
            :aria-label="t('automation.email.generateAria')"
            @click="submitEmailResponse"
          >
            <LoadingSpinner size="sm" :label="t('common.loading')" v-if="pendingAction === 'generate'" />
            <span v-else>{{ t("automation.email.generateButton") }}</span>
          </button>
          <button type="button"
            :class="[OUTLINE_ACTION_CLASS]"
            :disabled="pending || !canSubmit || !form.runAt"
            :aria-label="t('automation.email.schedule.buttonAria')"
            @click="submitScheduledEmailResponse"
          >
            <LoadingSpinner size="sm" :label="t('common.loading')" v-if="pendingAction === 'schedule'" />
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

    <div v-if="scheduledRun" :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <div role="alert" class="alert alert-info">
          <div>
            <h3 class="font-semibold">{{ t("automation.email.schedule.createdTitle") }}</h3>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("automation.email.runIdLabel", { id: scheduledRun.id }) }}</p>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{
                t("automation.email.schedule.scheduledForLabel", {
                  date: toLocalizedDateTime(resolveScheduledRunAt(scheduledRun)),
                })
              }}
            </p>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("automation.email.schedule.statusLabel", { status: scheduledRun.status }) }}
            </p>
          </div>
        </div>

        <div class="card-actions justify-end">
          <NuxtLink
            :to="APP_ROUTE_BUILDERS.automationRunDetail(scheduledRun.id)"
            :class="GHOST_ACTION_CLASS"
            :aria-label="t('automation.email.openRunDetailAria', { id: scheduledRun.id })"
          >
            {{ t("automation.email.openRunDetailButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="lastResult" :class="SURFACE_GLASS_CARD_CLASS">
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
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("automation.email.generatedProvider", { provider: lastResult.provider, model: lastResult.model }) }}</p>
            <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("automation.email.runIdLabel", { id: lastResult.runId }) }}</p>
            <p v-if="lastResult.recipientEmail" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("automation.email.recipientLabel", { email: lastResult.recipientEmail }) }}
            </p>
            <p v-if="lastResult.messageId" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("automation.email.messageIdLabel", { id: lastResult.messageId }) }}
            </p>
          </div>
        </div>

        <fieldset class="fieldset" :class="[MARGIN_TOKEN_CLASS.mt4]">
          <legend class="fieldset-legend">{{ t("automation.email.replyLegend") }}</legend>
          <textarea
            class="textarea" :class="[FLUID_WIDTH_CLASS, MIN_HEIGHT_SCROLL_CLASS]"
            readonly
            :value="lastResult.reply"
            :aria-label="t('automation.email.replyAria')"
          />
        </fieldset>

        <div class="card-actions justify-end">
          <NuxtLink
            :to="APP_ROUTE_BUILDERS.automationRunDetail(lastResult.runId)"
            :class="GHOST_ACTION_CLASS"
            :aria-label="t('automation.email.openRunDetailAria', { id: lastResult.runId })"
          >
            {{ t("automation.email.openRunDetailButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
