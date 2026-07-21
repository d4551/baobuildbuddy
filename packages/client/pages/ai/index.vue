<script setup lang="ts">
/**
 * Canonical AI entry: redirect to chat (no phantom empty surface).
 * Prefer Nuxt redirect meta over empty template + navigateTo for SSR/nav consistency.
 */
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";

definePageMeta({
  middleware: ["auth"],
  redirect: APP_ROUTES.aiChat,
});

const { t } = useI18n();

useSeoMeta({
  title: t("aiChatPage.seoTitle", { brand: "BaoBuildBuddy" }),
  description: t("aiChatPage.seoDescription"),
});
</script>

<template>
  <div class="sr-only" aria-hidden="true" />
</template>
