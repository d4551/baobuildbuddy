<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getSidebarNavigationItems, isRouteActive } from "~/constants/navigation";
import { KEYBOARD_ROUTE_SHORTCUTS } from "~/composables/useKeyboardShortcuts";

const route = useRoute();
const sidebarItems = getSidebarNavigationItems();
const { t } = useI18n();
const { settings, fetchSettings, isAiConfigurationIncomplete } = useSettings();

const shortcutByNavigationId = new Map(
  KEYBOARD_ROUTE_SHORTCUTS.map((shortcut) => [shortcut.id, shortcut]),
);

onMounted(async () => {
  if (settings.value) {
    return;
  }

  try {
    await fetchSettings();
  } catch {
    // Ignore sidebar hydration errors; settings page owns full recovery UX.
  }
});
</script>

<template>
  <nav :aria-label="t('a11y.primaryNavigation')" class="w-full min-h-full">
    <ul class="menu min-h-full w-full p-4 pt-6 gap-1">
      <li class="menu-title px-2 pb-4">
        <span class="flex items-center gap-2 text-lg font-bold text-primary is-drawer-close:hidden">
          <span aria-hidden="true">{{ APP_BRAND.logoEmoji }}</span>
          <span>{{ APP_BRAND.name }}</span>
        </span>
      </li>
      <li v-for="item in sidebarItems" :key="item.id">
        <NuxtLink
          :to="item.to"
          :class="[
            'flex items-center gap-2 rounded-box border-l-3 border-transparent pl-2 transition-all duration-200 is-drawer-close:tooltip is-drawer-close:tooltip-right',
            { 'menu-active border-primary': isRouteActive(route.path, item.to) },
          ]"
          :data-tip="t(item.labelKey)"
          :aria-current="isRouteActive(route.path, item.to) ? 'page' : undefined"
          :aria-label="t(item.labelKey)"
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
          <span class="is-drawer-close:hidden">{{ t(item.labelKey) }}</span>
          <span v-if="shortcutByNavigationId.has(item.id)" class="is-drawer-close:hidden ml-auto flex items-center gap-1 opacity-65">
            <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.prefix.toUpperCase() }}</kbd>
            <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.key.toUpperCase() }}</kbd>
          </span>
        </NuxtLink>
      </li>
      <li class="mt-auto pt-4">
        <label
          for="bao-drawer"
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
