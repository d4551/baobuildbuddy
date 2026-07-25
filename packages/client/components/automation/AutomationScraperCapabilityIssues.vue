<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  INSET_PANEL_MUTED_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  capabilityId: string;
  issueCount: number;
  issues: readonly string[];
  compactMode: boolean;
}>();

const { t } = useI18n();
const jobIntelligenceSettingsRoute = APP_ROUTE_BUILDERS.settingsSection("jobIntelligence");
</script>

<template>
  <div
    v-if="issueCount > 0 && compactMode"
    class="text-secondary"
    :class="[INSET_PANEL_MUTED_CLASS, PADDING_TOKEN_CLASS.p4, TYPOGRAPHY_SCALE_CLASS.sm]"
  >
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <p class="font-semibold text-base-content">
        {{ t("automation.scraper.providerCard.setupTitle", { count: issueCount }) }}
      </p>
      <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <li v-for="(issue, issueIndex) in issues" :key="`${capabilityId}-issue-${issueIndex}`">
          {{ issue }}
        </li>
      </ul>
      <div :class="['flex', 'justify-end', FLEX_GAP_TOKEN_CLASS.gap2]">
        <NuxtLink :to="jobIntelligenceSettingsRoute" :class="[PRIMARY_ACTION_CLASS]">
          {{ t("automation.hub.audit.actions.fixSetup") }}
        </NuxtLink>
      </div>
    </div>
  </div>

  <details
    v-else-if="issueCount > 0"
    :class="[INSET_PANEL_MUTED_CLASS, 'collapse collapse-arrow']"
  >
    <summary class="collapse-title text-base font-semibold">
      {{ t("automation.scraper.providerCard.setupTitle", { count: issueCount }) }}
    </summary>
    <div
      class="collapse-content text-secondary"
      :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4, TYPOGRAPHY_SCALE_CLASS.sm]"
    >
      <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <li v-for="(issue, issueIndex) in issues" :key="`${capabilityId}-issue-${issueIndex}`">
          {{ issue }}
        </li>
      </ul>
      <div :class="['flex', 'justify-end', FLEX_GAP_TOKEN_CLASS.gap2]">
        <NuxtLink :to="jobIntelligenceSettingsRoute" :class="[PRIMARY_ACTION_CLASS]">
          {{ t("automation.hub.audit.actions.fixSetup") }}
        </NuxtLink>
      </div>
    </div>
  </details>
</template>
