<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";

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
  <section class="card card-border card-glass glass-interactive overflow-hidden">
    <div class="card-body relative gap-4">
      <div class="relative space-y-3">
        <div class="badge badge-primary badge-soft w-fit">
          {{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}
        </div>
        <h2 class="card-title text-2xl md:text-3xl">
          {{ welcomeHeading }}
        </h2>
        <p class="text-base text-secondary">
          {{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}
        </p>
        <div class="badge badge-outline badge-lg text-rotate w-fit bg-base-100">
          <Transition name="hero-text-rotate" mode="out-in">
            <span :key="activeHeroPhrase">{{ activeHeroPhrase }}</span>
          </Transition>
        </div>
      </div>
      <div v-if="showSetupAction" class="card-actions relative mt-1 flex-wrap">
        <NuxtLink :to="primaryRoute" class="btn btn-primary">
          {{ primaryLabel }}
        </NuxtLink>
        <NuxtLink :to="APP_ROUTES.setup" class="btn btn-ghost">
          {{ t(DASHBOARD_COPY_KEYS.setupCtaLabel) }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
