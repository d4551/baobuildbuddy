<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getDockNavigationItems, isRouteActive } from "~/constants/navigation";

const route = useRoute();
const dockItems = getDockNavigationItems();
const { t } = useI18n();
</script>

<template>
  <nav class="dock lg:hidden" :aria-label="t('a11y.mobilePrimaryNavigation')">
    <NuxtLink
      v-for="item in dockItems"
      :key="item.id"
      :to="item.to"
      :class="{ 'dock-active': isRouteActive(route.path, item.to) }"
      :aria-current="isRouteActive(route.path, item.to) ? 'page' : undefined"
      :aria-label="t(item.labelKey)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
      </svg>
      <span class="dock-label">{{ t(item.labelKey) }}</span>
    </NuxtLink>
  </nav>
</template>
