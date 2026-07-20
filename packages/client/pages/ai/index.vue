<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
useSeoMeta({
  title: () => t("aiChatPage.title"),
  description: () => t("aiChatPage.subtitle"),
});

await navigateTo(APP_ROUTES.aiChat, { replace: true });
</script>

<template>
  <div />
</template>
