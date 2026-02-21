<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { APP_DRAWER_ID } from "~/constants/layout";
import type { NavigationItem } from "~/constants/navigation";
import { settlePromise } from "~/composables/async-flow";
import { getSidebarNavigationItems, isRouteActive } from "~/constants/navigation";
import { KEYBOARD_ROUTE_SHORTCUTS } from "~/composables/useKeyboardShortcuts";

const route = useRoute();
const sidebarItems = getSidebarNavigationItems();
const { t } = useI18n();
const { settings, fetchSettings, isAiConfigurationIncomplete } = useSettings();

const shortcutByNavigationId = new Map(
  KEYBOARD_ROUTE_SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]),
);

const activeNavigationIds = computed(() => {
  const activeIds = new Set<string>();
  for (const item of sidebarItems) {
    if (isRouteActive(route.path, item.to)) {
      activeIds.add(item.id);
    }
  }
  return activeIds;
});

const localizedSidebarLabels = computed(() => {
  const labelsById = new Map<string, string>();
  for (const item of sidebarItems) {
    labelsById.set(item.id, t(item.labelKey));
  }
  return labelsById;
});

function isSidebarItemActive(item: NavigationItem): boolean {
  return activeNavigationIds.value.has(item.id);
}

function resolveSidebarLabel(item: NavigationItem): string {
  return localizedSidebarLabels.value.get(item.id) ?? "";
}

async function hydrateSidebarSettings(): Promise<void> {
  if (settings.value) {
    return;
  }
  await settlePromise(fetchSettings(), "sidebar.settingsHydrationFailed");
}

onMounted(() => {
  void hydrateSidebarSettings();
});
</script>

<template>
  <nav :aria-label="t('a11y.primaryNavigation')" class="w-full min-h-full">
    <ul class="menu min-h-full w-full p-4 pt-6 gap-1">
      <li class="menu-title px-2 pb-4">
        <span class="flex items-center gap-2 text-lg font-bold text-primary is-drawer-close:hidden">
          <img :src="APP_BRAND.logoPath" alt="" aria-hidden="true" class="h-5 w-5 shrink-0 rounded-sm" />
          <span>{{ APP_BRAND.name }}</span>
        </span>
      </li>
      <li v-for="item in sidebarItems" :key="item.id">
        <NuxtLink
          :to="item.to"
          :class="[
            'flex items-center gap-2 rounded-box border-l-3 border-transparent pl-2 transition-all duration-200 is-drawer-close:tooltip is-drawer-close:tooltip-right',
            { 'menu-active border-primary': isSidebarItemActive(item) },
          ]"
          :data-tip="resolveSidebarLabel(item)"
          :aria-current="isSidebarItemActive(item) ? 'page' : undefined"
          :aria-label="resolveSidebarLabel(item)"
        >
          <span class="indicator">
            <span
              v-if="item.id === 'settings' && isAiConfigurationIncomplete"
              class="indicator-item badge badge-warning badge-xs"
            ></span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
            </svg>
          </span>
          <span class="is-drawer-close:hidden">{{ resolveSidebarLabel(item) }}</span>
          <span v-if="shortcutByNavigationId.has(item.id)" class="is-drawer-close:hidden ml-auto flex items-center gap-1 opacity-65">
            <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.prefix.toUpperCase() }}</kbd>
            <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.key.toUpperCase() }}</kbd>
          </span>
        </NuxtLink>
      </li>
      <li class="mt-auto pt-4">
        <label
          :for="APP_DRAWER_ID"
          class="btn btn-ghost btn-sm w-full justify-start is-drawer-close:btn-square"
          :aria-label="t('a11y.toggleSidebarNavigation')"
        >
          <svg class="h-5 w-5 transition-transform duration-200 is-drawer-open:rotate-y-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="is-drawer-close:hidden">{{ t("a11y.toggleSidebarNavigation") }}</span>
        </label>
      </li>
    </ul>
  </nav>
</template>
