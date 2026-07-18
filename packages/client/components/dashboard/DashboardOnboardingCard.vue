<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";
import { DASHBOARD_ONBOARDING_STEPS } from "~/constants/dashboard-core";

defineProps<{
  primaryRoute: string;
  primaryLabel: string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="hero overflow-hidden rounded-box border border-base-300 bg-base-200" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="hero-content max-w-none" :class="[FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS.px0]">
      <div class="card card-border card-glass" :class="[FLUID_WIDTH_CLASS]">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap5, PADDING_TOKEN_CLASS.p6, `lg:${PADDING_TOKEN_CLASS.p8}`]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <div class="badge badge-primary badge-outline w-fit">
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
            <NuxtLink :to="primaryRoute" class="btn btn-primary">
              {{ primaryLabel }}
            </NuxtLink>
            <NuxtLink :to="APP_ROUTES.jobs" class="btn btn-soft btn-primary">
              {{ t("dashboard.quickActions.actions.browseJobs") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
