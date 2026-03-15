<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

useHead({
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | ${APP_BRAND.name}` : APP_BRAND.name),
});

useSeoMeta(() => ({
  title: t("meta.title"),
  description: t("meta.description"),
  ogTitle: t("meta.title"),
  ogDescription: t("meta.description"),
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
