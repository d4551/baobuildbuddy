<script setup lang="ts">
import {
  RESPONSIVE_TEXT_MD_3XL_CLASS,
  RESPONSIVE_TEXT_XL_4XL_CLASS,
} from "~/constants/ui-layout";
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
  <section :class="[SURFACE_GLASS_CARD_CLASS, 'overflow-hidden', 'glass-card-enter glass-card-enter-0']">
    <div class="card-body relative" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="relative" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <div class="badge badge-primary badge-soft w-fit">
          {{ t(DASHBOARD_COPY_KEYS.pipelineTitle) }}
        </div>
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.xl2, RESPONSIVE_TEXT_MD_3XL_CLASS, RESPONSIVE_TEXT_XL_4XL_CLASS]">
          {{ welcomeHeading }}
        </h2>
        <p class="text-base text-secondary">
          {{ t(DASHBOARD_COPY_KEYS.welcomeDescription) }}
        </p>
        <div class="badge badge-outline badge-lg w-fit bg-base-100">
          <Transition name="hero-text-rotate" mode="out-in">
            <span :key="activeHeroPhrase">{{ activeHeroPhrase }}</span>
          </Transition>
        </div>
      </div>
      <div
        v-if="showSetupAction"
        class="card-actions relative flex w-full flex-col sm:flex-row"
        :class="[MARGIN_TOKEN_CLASS.mt1, FLEX_GAP_TOKEN_CLASS.gap2]"
      >
        <NuxtLink :to="primaryRoute" class="btn btn-primary w-full sm:w-auto">
          {{ primaryLabel }}
        </NuxtLink>
        <!-- Avoid duplicate Complete Setup CTAs when primary already targets setup. -->
        <NuxtLink
          v-if="primaryRoute !== APP_ROUTES.setup"
          :to="APP_ROUTES.setup"
          class="btn btn-ghost w-full sm:w-auto"
        >
          {{ t(DASHBOARD_COPY_KEYS.setupCtaLabel) }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
