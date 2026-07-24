<script setup lang="ts">
import { APP_SEMVER } from "@bao/shared/constants/app-version";
import { useI18n } from "vue-i18n";
import {
  APP_DRAWER_ID,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SHELL_SIDEBAR_ITEM_CLASS,
  SHELL_SIDEBAR_MENU_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { NavigationItem } from "~/constants/navigation";
import { getSidebarNavigationGroups, isRouteActive } from "~/constants/navigation";
import { setDrawerToggleState } from "~/utils/drawer-controls";

const route = useRoute();
const sidebarGroups = getSidebarNavigationGroups();
const { t } = useI18n();
const { resolvedBrand } = useBrand();
const { isAiConfigurationIncomplete } = useSettings();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);

const activeNavigationIds = computed(() => {
  const activeIds = new Set<string>();
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (isRouteActive(route.path, item.to)) {
        activeIds.add(item.id);
      }
    }
  }
  return activeIds;
});

function isSidebarItemActive(item: NavigationItem): boolean {
  return activeNavigationIds.value.has(item.id);
}

function resolveSidebarLabel(item: NavigationItem): string {
  return t(item.labelKey);
}

function sidebarLinkClass(item: NavigationItem): string[] {
  return [SHELL_SIDEBAR_ITEM_CLASS, isSidebarItemActive(item) ? "menu-active font-medium" : ""];
}
</script>

<template>
  <div class="flex flex-col" :class="[FLUID_WIDTH_CLASS, FLUID_HEIGHT_CLASS]">
    <div class="border-b border-base-300 is-drawer-close:hidden" :class="[PADDING_TOKEN_CLASS.p4]">
      <span class="flex items-center text-primary" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, FLEX_GAP_TOKEN_CLASS.gap2, TYPOGRAPHY_SCALE_CLASS.lg]">
        <img :src="resolvedBrand.logoPath" alt="" aria-hidden="true" :class="[ICON_SIZE_CLASS.sm, 'shrink-0 ', RADIUS_TOKEN_CLASS.sm]" />
        <span>{{ resolvedBrand.name }}</span>
      </span>
    </div>
    <nav :aria-label="t('a11y.primaryNavigation')" class="flex flex-1 flex-col" :class="[MIN_HEIGHT_ZERO_CLASS, TRUNCATE_FLEX_CHILD_CLASS]">
      <template v-for="group in sidebarGroups" :key="group.id">
        <p
          class="is-drawer-close:hidden menu-title text-muted"
          :class="[
            PADDING_TOKEN_CLASS.px4,
            PADDING_TOKEN_CLASS.pt3,
            TYPOGRAPHY_SCALE_CLASS.xs,
            FONT_WEIGHT_TOKEN_CLASS.semibold,
          ]"
        >
          {{ t(group.labelKey) }}
        </p>
        <ul :class="SHELL_SIDEBAR_MENU_CLASS">
          <li v-for="item in group.items" :key="item.id">
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
                  class="indicator-item badge badge-warning badge-xs" :class="[FONT_WEIGHT_TOKEN_CLASS.bold]"
                  role="status"
                  :aria-label="t('a11y.aiConfigIncompleteAria')"
                  :title="t('a11y.aiConfigIncompleteAria')"
                >!</span>
                <svg xmlns="http://www.w3.org/2000/svg" :class="[ICON_SIZE_CLASS.sm, 'shrink-0']" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" :d="item.iconPath" />
                </svg>
              </span>
              <span class="is-drawer-close:hidden">{{ resolveSidebarLabel(item) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </template>
      <ul :class="SHELL_SIDEBAR_MENU_CLASS" class="mt-auto">
        <li :class="[PADDING_TOKEN_CLASS.pt4]">
          <button 
            type="button"
            class="btn btn-ghost justify-start is-drawer-close:btn-square"
            :class="[FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS]"
            :aria-label="t('a11y.toggleSidebarNavigation')"
            :aria-controls="APP_DRAWER_ID"
            :aria-expanded="isDrawerOpen"
            @click="setDrawerToggleState(!isDrawerOpen)"
          >
            <svg :class="[ICON_SIZE_CLASS.sm, 'transition-transform duration-[var(--motion-standard)] ease-[var(--ease-response)] is-drawer-open:rotate-y-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="is-drawer-close:hidden">{{ t("a11y.toggleSidebarNavigation") }}</span>
          </button>
        </li>
      </ul>
    </nav>
    <div class="border-t border-base-300 is-drawer-close:hidden" :class="[PADDING_TOKEN_CLASS.p4]">
      <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
        {{ t("layout.shell.versionLabel", { version: APP_SEMVER }) }}
      </p>
    </div>
  </div>
</template>
