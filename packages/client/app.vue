<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

useHead(() => ({
  title: t("meta.title"),
  meta: [{ name: "description", content: t("meta.description") }],
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
