<script setup lang="ts">
import type { AvailableLocale } from "~/constants/i18n-catalog";
import { buildBrandedLocaleMessages } from "~/utils/brand-overrides";
import { useI18n } from "vue-i18n";

const { settings, fetchSettings } = useSettings();
const { resolvedBrand } = useBrand();
const i18n = useI18n();
const { t, locale } = i18n;

await useAsyncData(
  "app-shell-settings",
  async () => {
    if (!settings.value) {
      await fetchSettings();
    }
    return true;
  },
  {
    server: true,
    lazy: false,
  },
);

watchEffect(() => {
  const nextLocale = locale.value as AvailableLocale;
  i18n.setLocaleMessage(
    nextLocale,
    buildBrandedLocaleMessages(nextLocale, resolvedBrand.value.content.contentOverrides),
  );
});

useHead(() => ({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} | ${resolvedBrand.value.name}` : resolvedBrand.value.name,
  link: [
    { rel: "icon", type: "image/svg+xml", href: resolvedBrand.value.faviconPath },
    { rel: "alternate icon", href: resolvedBrand.value.faviconPath },
    ...(resolvedBrand.value.typography.fontStylesheetUrl
      ? [{ rel: "stylesheet", href: resolvedBrand.value.typography.fontStylesheetUrl }]
      : []),
  ],
}));

useHeadSafe(() => ({
  meta: [
    { name: "description", content: resolvedBrand.value.content.defaultDescription },
    { property: "og:title", content: t("meta.title", { brand: resolvedBrand.value.name }) },
    { property: "og:description", content: t("meta.description") },
  ],
}));

useSeoMeta(() => ({
  title:
    resolvedBrand.value.content.defaultTitle ||
    t("meta.title", { brand: resolvedBrand.value.name }),
  description: resolvedBrand.value.content.defaultDescription,
  ogTitle: t("meta.title", { brand: resolvedBrand.value.name }),
  ogDescription: t("meta.description"),
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
