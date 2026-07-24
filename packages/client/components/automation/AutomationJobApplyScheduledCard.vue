<script setup lang="ts">
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { useI18n } from "vue-i18n";
import { ALERT_VARIANT_CLASS, MARGIN_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";

defineProps<{
  resolveScheduledRunAt: (run: RpaRunExecutionEnvelope) => string;
  run: RpaRunExecutionEnvelope;
  runDetailRoute: (id: string) => string;
  toLocalizedDateTime: (value: string) => string;
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <div role="alert" class="alert" :class="[ALERT_VARIANT_CLASS.info]">
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
  </UiGlassCard>
</template>
