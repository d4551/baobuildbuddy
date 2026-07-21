<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_SOFT_PRIMARY_CLASS,
} from "~/constants/layout-badges";
import {
  RESPONSIVE_FLEX_COL_SM_ROW_CLASS,
  RESPONSIVE_TEXT_MD_3XL_CLASS,
  RESPONSIVE_WIDTH_SM_AUTO_CLASS,
} from "~/constants/ui-layout";

defineProps<{
  welcomeHeading: string;
  activeHeroPhrase: string;
  primaryRoute: string;
  primaryLabel: string;
  showSetupAction: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard :stagger-index="0" extra-class="overflow-hidden">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3, PADDING_TOKEN_CLASS.p4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <div class="w-fit" :class="[BADGE_SOFT_PRIMARY_CLASS]">
          {{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}
        </div>
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, RESPONSIVE_TEXT_MD_3XL_CLASS]">
          {{ welcomeHeading }}
        </h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}
        </p>
        <p class="text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.sm, FONT_WEIGHT_TOKEN_CLASS.semibold]" aria-live="polite">
          <Transition name="hero-text-rotate" mode="out-in">
            <span :key="activeHeroPhrase">{{ activeHeroPhrase }}</span>
          </Transition>
        </p>
      </div>
      <div
        class="card-actions relative"
        :class="[
          FLUID_WIDTH_CLASS,
          RESPONSIVE_FLEX_COL_SM_ROW_CLASS,
          MARGIN_TOKEN_CLASS.mt1,
          FLEX_GAP_TOKEN_CLASS.gap2,
        ]"
      >
        <NuxtLink
          :to="primaryRoute"
          :class="[PRIMARY_ACTION_CLASS, FLUID_WIDTH_CLASS, RESPONSIVE_WIDTH_SM_AUTO_CLASS]"
        >
          {{ primaryLabel }}
        </NuxtLink>
        <!-- Secondary setup only when profile incomplete and primary is not already setup. -->
        <NuxtLink
          v-if="showSetupAction && primaryRoute !== APP_ROUTES.setup"
          :to="APP_ROUTES.setup"
          :class="[OUTLINE_ACTION_CLASS, FLUID_WIDTH_CLASS, RESPONSIVE_WIDTH_SM_AUTO_CLASS, TOUCH_TARGET_MIN_CLASS]"
        >
          {{ t(DASHBOARD_COPY_KEYS.setupCtaLabel) }}
        </NuxtLink>
      </div>
    </div>
  </UiGlassCard>
</template>
