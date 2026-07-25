<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";
import { DASHBOARD_ONBOARDING_STEPS } from "~/constants/dashboard-core";
import {
  BADGE_PRIMARY_OUTLINE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { RESPONSIVE_PADDING_LG_P8_CLASS } from "~/constants/ui-layout";

defineProps<{
  primaryRoute: string;
  primaryLabel: string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="hero overflow-hidden rounded-box border border-base-300 card-glass" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="hero-content max-w-none" :class="[FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS.px0]">
      <div :class="[SURFACE_GLASS_CARD_CLASS, FLUID_WIDTH_CLASS]">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap5, PADDING_TOKEN_CLASS.p6, RESPONSIVE_PADDING_LG_P8_CLASS]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <div :class="[BADGE_PRIMARY_OUTLINE_CLASS, 'w-fit']">
              {{ t(DASHBOARD_COPY_KEYS.pageTitle) }}
            </div>
            <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">
              {{ t(DASHBOARD_COPY_KEYS.emptyStateTitle) }}
            </h2>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t(DASHBOARD_COPY_KEYS.emptyStateDescription) }}
            </p>
          </div>

          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
            <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t(DASHBOARD_COPY_KEYS.onboardingChecklistTitle) }}
            </h3>
            <ul class="steps steps-vertical lg:steps-horizontal" :class="[FLUID_WIDTH_CLASS]">
              <li 
                v-for="step in DASHBOARD_ONBOARDING_STEPS"
                :key="step.id"
                class="step step-primary"
              >
                <NuxtLink :to="step.to" class="link link-hover">
                  {{ t(step.labelKey) }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="card-actions flex-wrap">
            <NuxtLink :to="primaryRoute" :class="[PRIMARY_ACTION_CLASS]">
              {{ primaryLabel }}
            </NuxtLink>
            <NuxtLink
              :to="APP_ROUTES.jobs"
              :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
            >
              {{ t("dashboard.quickActions.actions.browseJobs") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
