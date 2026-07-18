<script setup lang="ts">
import {  SURFACE_GLASS_CARD_CLASS, MARGIN_TOKEN_CLASS, SHADOW_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import {  SURFACE_GLASS_CARD_CLASS, useI18n } from "vue-i18n";

defineProps<{
  resolveScheduledRunAt: (run: RpaRunExecutionEnvelope) => string;
  run: RpaRunExecutionEnvelope;
  runDetailRoute: (id: string) => string;
  toLocalizedDateTime: (value: string) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[SURFACE_GLASS_CARD_CLASS, 'glass-card-hover']">
    <div class="card-body">
      <div role="alert" class="alert alert-info">
        <h3 class="font-semibold">{{ t("automation.jobApply.schedule.createdTitle") }}</h3>
        <div>
          <p :class="[MARGIN_TOKEN_CLASS.mb1]">{{ t("automation.jobApply.runIdLabel", { id: run.id }) }}</p>
          <p :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">
            {{
              t("automation.jobApply.schedule.scheduledForLabel", {
                date: toLocalizedDateTime(resolveScheduledRunAt(run)),
              })
            }}
          </p>
          <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("automation.jobApply.statusLabel", { status: run.status }) }}</p>
          <NuxtLink
            :to="runDetailRoute(run.id)"
            class="link link-primary link-hover"
            :aria-label="t('automation.jobApply.openRunDetailAria', { id: run.id })"
          >
            {{ t("automation.jobApply.openRunDetailLink") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
