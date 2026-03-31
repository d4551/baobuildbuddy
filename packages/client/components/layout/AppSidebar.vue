<script setup lang="ts">
import { APP_SEMVER } from "@bao/shared/constants/app-version";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { KEYBOARD_ROUTE_SHORTCUTS } from "~/composables/useKeyboardShortcuts";
import { APP_DRAWER_ID, SHELL_SIDEBAR_MENU_CLASS } from "~/constants/layout";
import type { NavigationItem } from "~/constants/navigation";
import { getSidebarNavigationItems, isRouteActive } from "~/constants/navigation";
import { setDrawerToggleState } from "~/utils/drawer-controls";

const route = useRoute();
const sidebarItems = getSidebarNavigationItems();
const { t } = useI18n();
const { resolvedBrand } = useBrand();
const { settings, fetchSettings, isAiConfigurationIncomplete } = useSettings();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);

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

function sidebarLinkClass(item: NavigationItem): string[] {
  return [
    "flex min-h-10 items-center gap-2 rounded-box px-2 transition-colors duration-200 is-drawer-close:tooltip is-drawer-close:tooltip-right",
    isSidebarItemActive(item) ? "menu-active font-medium" : "",
  ];
}

async function hydrateSidebarSettings(): Promise<void> {
  if (settings.value) {
    return;
  }
  await settlePromise(fetchSettings(), t("apiErrors.settings.fetchFailed"));
}

onMounted(() => {
  void hydrateSidebarSettings();
});
</script>

<template>
  <div class="flex min-h-full w-full flex-col">
    <div class="border-b border-base-300 p-4 is-drawer-close:hidden">
      <span class="flex items-center gap-2 text-lg font-bold text-primary">
        <img :src="resolvedBrand.logoPath" alt="" aria-hidden="true" class="h-5 w-5 shrink-0 rounded-sm" />
        <span>{{ resolvedBrand.name }}</span>
      </span>
    </div>
    <nav :aria-label="t('a11y.primaryNavigation')" class="flex min-h-0 min-w-0 flex-1 flex-col">
      <ul :class="SHELL_SIDEBAR_MENU_CLASS">
        <li v-for="item in sidebarItems" :key="item.id">
          <NuxtLink
            :to="item.to"
            :class="sidebarLinkClass(item)"
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
            <span v-if="shortcutByNavigationId.has(item.id)" class="is-drawer-close:hidden ml-auto flex items-center gap-1 text-base-content/60">
              <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.prefix.toUpperCase() }}</kbd>
              <kbd class="kbd kbd-sm">{{ shortcutByNavigationId.get(item.id)?.key.toUpperCase() }}</kbd>
            </span>
          </NuxtLink>
        </li>
        <li class="mt-auto pt-4">
          <button
            type="button"
            class="btn btn-ghost btn-sm w-full justify-start is-drawer-close:btn-square"
            :aria-label="t('a11y.toggleSidebarNavigation')"
            :aria-controls="APP_DRAWER_ID"
            :aria-expanded="isDrawerOpen"
            @click="setDrawerToggleState(!isDrawerOpen)"
          >
            <svg class="h-5 w-5 transition-transform duration-200 is-drawer-open:rotate-y-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="is-drawer-close:hidden">{{ t("a11y.toggleSidebarNavigation") }}</span>
          </button>
        </li>
      </ul>
    </nav>
    <footer
      class="border-t border-base-300 p-4 text-xs text-base-content/40 is-drawer-close:hidden"
      :aria-label="t('layout.shell.versionFooterAria')"
    >
      {{ t("layout.shell.appVersion", { version: APP_SEMVER }) }}
    </footer>
  </div>
</template>
