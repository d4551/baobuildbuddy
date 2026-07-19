<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  APP_MAIN_CONTENT_ID,
  ERROR_PAGE_MAX_WIDTH_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  SHELL_SKIP_LINK_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  error: {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
  };
}>();

const { t } = useI18n();
const { resolvedBrand } = useBrand();
const message = computed(() => {
  return props.error.statusMessage || props.error.message || t("errorPage.fallbackMessage");
});
</script>

<template>
  <div class="min-h-screen hero bg-base-200">
    <a :href="`#${APP_MAIN_CONTENT_ID}`" :class="SHELL_SKIP_LINK_CLASS" :aria-label="t('a11y.skipToContent')">{{ t("a11y.skipToContent") }}</a>
    <div class="hero-content text-center">
      <main :id="APP_MAIN_CONTENT_ID" tabindex="-1" :class="[ERROR_PAGE_MAX_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <h1 :class="[TYPOGRAPHY_SCALE_CLASS.xl4, 'font-bold']">{{ t("errorPage.title", { brand: resolvedBrand.name }) }}</h1>
        <p class="text-secondary">
          {{ message }}
        </p>
        <div role="alert" class="alert alert-info">
          <span>{{ t("errorPage.statusLabel") }}: {{ error.statusCode || 500 }}</span>
        </div>
        <div class="flex justify-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <NuxtLink :to="APP_ROUTES.dashboard" class="btn btn-primary" :aria-label="t('errorPage.backToDashboardButton')">
            {{ t("errorPage.backToDashboardButton") }}
          </NuxtLink>
          <button class="btn btn-ghost" :aria-label="t('errorPage.resetButton')" @click="clearError({ redirect: APP_ROUTES.dashboard })">
            {{ t("errorPage.resetButton") }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
