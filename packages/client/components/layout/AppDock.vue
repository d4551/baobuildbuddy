<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ICON_DECORATIVE_STROKE_WIDTH, ICON_SIZE_CLASS } from "~/constants/layout";
import type { NavigationItem } from "~/constants/navigation";
import { getDockNavigationItems, isRouteActive } from "~/constants/navigation";

const route = useRoute();
const dockItems = getDockNavigationItems();
const { t } = useI18n();

const activeDockItemIds = computed(() => {
  const activeIds = new Set<string>();
  for (const item of dockItems) {
    if (isRouteActive(route.path, item.to)) {
      activeIds.add(item.id);
    }
  }
  return activeIds;
});

function isDockItemActive(item: NavigationItem): boolean {
  return activeDockItemIds.value.has(item.id);
}
</script>

<template>
  <nav class="dock glass-clear border-t border-base-300 lg:hidden" :aria-label="t('a11y.mobilePrimaryNavigation')">
    <NuxtLink
      v-for="item in dockItems"
      :key="item.id"
      :to="item.to"
      :class="{ 'dock-active': isDockItemActive(item) }"
      :aria-current="isDockItemActive(item) ? 'page' : undefined"
      :aria-label="t(item.labelKey)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" :class="ICON_SIZE_CLASS.sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" :d="item.iconPath" />
      </svg>
      <span class="dock-label">{{ t(item.labelKey) }}</span>
    </NuxtLink>
  </nav>
</template>
