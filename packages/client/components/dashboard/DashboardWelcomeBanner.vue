<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard";

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
  <section class="card card-border overflow-hidden bg-base-100 shadow-sm">
    <div class="card-body relative gap-4 bg-linear-to-br from-primary/12 via-base-100 to-secondary/12">
      <div
        class="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      ></div>
      <div
        class="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden="true"
      ></div>
      <div class="relative space-y-3">
        <div class="badge badge-primary badge-soft w-fit">
          {{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}
        </div>
        <h2 class="card-title text-2xl md:text-3xl">
          {{ welcomeHeading }}
        </h2>
        <p class="text-base text-base-content/70">
          {{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}
        </p>
        <div class="badge badge-outline badge-lg text-rotate w-fit bg-base-100/70">
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
