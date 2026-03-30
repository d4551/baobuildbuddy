<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS, DASHBOARD_ONBOARDING_STEPS } from "~/constants/dashboard";

defineProps<{
  primaryRoute: string;
  primaryLabel: string;
}>();

const { t } = useI18n();
</script>

<template>
  <section
    class="hero overflow-hidden rounded-box border border-base-300 bg-linear-to-br from-base-100 via-base-100 to-primary/10 shadow-sm"
  >
    <div class="hero-content w-full max-w-none px-0">
      <div class="card w-full bg-base-100/90 backdrop-blur">
        <div class="card-body gap-5 p-6 lg:p-8">
          <div class="space-y-2">
            <div class="badge badge-primary badge-outline w-fit">
              {{ t(DASHBOARD_COPY_KEYS.pageTitle) }}
            </div>
            <h2 class="card-title text-2xl">
              {{ t(DASHBOARD_COPY_KEYS.emptyStateTitle) }}
            </h2>
            <p class="text-sm text-base-content/70">
              {{ t(DASHBOARD_COPY_KEYS.emptyStateDescription) }}
            </p>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold">
              {{ t(DASHBOARD_COPY_KEYS.onboardingChecklistTitle) }}
            </h3>
            <ul class="steps steps-vertical w-full lg:steps-horizontal">
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
