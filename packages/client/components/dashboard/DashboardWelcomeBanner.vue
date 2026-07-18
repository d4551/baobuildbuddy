<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
  <section :class="[SURFACE_GLASS_CARD_CLASS, 'glass-interactive overflow-hidden', 'glass-card-enter glass-card-enter-0']">
    <div class="card-body relative" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="relative" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <div class="badge badge-primary badge-soft w-fit">
          {{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}
        </div>
        <h2 class="card-title md:" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, TYPOGRAPHY_SCALE_CLASS.xl3]">
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
      <div v-if="showSetupAction" class="card-actions relative flex-wrap" :class="[MARGIN_TOKEN_CLASS.mt1]">
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
