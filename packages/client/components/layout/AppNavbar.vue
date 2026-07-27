<script setup lang="ts">
import { THEME_NAMES } from "@bao/shared/tokens/branding";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { resolveLocaleLabel } from "~/constants/i18n";
import {
  APP_DRAWER_ID,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  GHOST_ACTION_SQUARE_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MAX_HEIGHT_TOKEN_CLASS,
  MAX_W_40_CLASS,
  RADIUS_TOKEN_CLASS,
  SHELL_NAVBAR_CLASS,
  SHELL_NAVBAR_DROPDOWN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  NAVBAR_SCROLL_ELEVATION_PX,
} from "~/constants/numeric-ui";
import { setDrawerToggleState } from "~/utils/drawer-controls";

const { theme, setTheme } = useTheme();
const { updateSettings } = useSettings();
const { resolvedBrand } = useBrand();
const { navbarBreadcrumbs } = useNavbarBreadcrumbs();
const { t, locale, availableLocales } = useI18n();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
const userMenuRef = useTemplateRef<HTMLDetailsElement>("userMenu");
const isUserMenuOpen = ref(false);
const isScrolled = ref(false);
const isDarkTheme = computed(() => theme.value === THEME_NAMES.dark);
const mobileSectionLabel = computed(() => {
  const crumbs = navbarBreadcrumbs.value;
  return crumbs.length > 1 ? (crumbs[crumbs.length - 1]?.label ?? "") : "";
});
const userMenuId = `app-navbar-user-menu-${useId()}`;
const themeControllerId = `app-navbar-theme-controller-${useId()}`;
const getLocaleLabel = (localeCode: string): string => resolveLocaleLabel(t, localeCode);
let themePersistRequestId = 0;

function closeUserMenu(): void {
  if (userMenuRef.value) {
    userMenuRef.value.open = false;
    isUserMenuOpen.value = false;
  }
}

function onWindowScroll(): void {
  isScrolled.value = window.scrollY > NAVBAR_SCROLL_ELEVATION_PX;
}

function selectLocale(nextLocale: string): void {
  locale.value = nextLocale;
  closeUserMenu();
}

function syncUserMenuState(): void {
  isUserMenuOpen.value = userMenuRef.value?.open ?? false;
}

async function applyThemePreference(nextTheme: typeof THEME_NAMES.light | typeof THEME_NAMES.dark): Promise<void> {
  const previousTheme = theme.value;
  if (previousTheme === nextTheme) {
    return;
  }
  // Optimistic UI update (documentElement + shell) before settings persist.
  setTheme(nextTheme, { persist: false });
  const requestId = ++themePersistRequestId;
  const saveResult = await settlePromise(
    updateSettings({ theme: nextTheme }),
    t("settings.errors.failedToSaveTheme"),
  );
  if (requestId !== themePersistRequestId) {
    return;
  }
  if (!saveResult.ok) {
    setTheme(previousTheme, { persist: false });
    return;
  }
  setTheme(nextTheme, { persist: true });
}

/** Single activation path — checkbox is daisyUI visual state only (no @change; avoids double-toggle). */
async function onThemeSwapActivate(): Promise<void> {
  await applyThemePreference(
    theme.value === THEME_NAMES.dark ? THEME_NAMES.light : THEME_NAMES.dark,
  );
}

onMounted(() => {
  onWindowScroll();
  window.addEventListener("scroll", onWindowScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onWindowScroll);
});
</script>

<template>
  <nav 
    class="navbar"
    :class="SHELL_NAVBAR_CLASS"
    :data-scrolled="isScrolled || undefined"
    :aria-label="t('a11y.appHeader')"
  >
    <div class="navbar-start flex flex-1 items-center" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap2, FLEX_GAP_TOKEN_CLASS.gap4]">
      <button
        type="button"
        :class="[GHOST_ACTION_SQUARE_CLASS, 'drawer-button shrink-0 lg:hidden']"
        :aria-label="t('a11y.toggleSidebar')"
        :aria-controls="APP_DRAWER_ID"
        :aria-expanded="isDrawerOpen"
        @click="setDrawerToggleState(!isDrawerOpen)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" :class="ICON_SIZE_CLASS.sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <NuxtLink
        :to="APP_ROUTES.dashboard"
        :class="[GHOST_ACTION_CLASS, 'shrink-0 text-primary lg:hidden', FLEX_GAP_TOKEN_CLASS.gap2]"
        :aria-label="resolvedBrand.name"
      >
        <img :src="resolvedBrand.logoPath" alt="" aria-hidden="true" :class="[ICON_SIZE_CLASS.sm, 'shrink-0', RADIUS_TOKEN_CLASS.sm]" />
        <span class="sr-only">{{ resolvedBrand.name }}</span>
        <!-- Below sm the page h1 owns the section title; avoid "A…" / "In…" chrome truncation @320. -->
        <span
          v-if="mobileSectionLabel"
          class="hidden truncate font-semibold sm:inline"
          :class="[MAX_W_40_CLASS, TYPOGRAPHY_SCALE_CLASS.sm]"
        >{{ mobileSectionLabel }}</span>
      </NuxtLink>
      <div class="hidden flex-1 lg:block" :class="[TRUNCATE_FLEX_CHILD_CLASS]">
        <AppBreadcrumbs :crumbs="navbarBreadcrumbs" class="truncate" />
      </div>
    </div>
    <div class="navbar-center hidden lg:flex transition-[opacity,height] duration-[var(--motion-standard)] ease-[var(--ease-response)]" :class="isScrolled ? ['overflow-hidden', 'opacity-0', MAX_HEIGHT_TOKEN_CLASS.maxH0] : []">
      <span class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ resolvedBrand.content.tagline }}</span>
    </div>
    <div class="navbar-end" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
      <WorkspaceOmniSearch />
      <button
        :id="themeControllerId"
        type="button"
        :class="[GHOST_ACTION_SQUARE_CLASS, 'swap swap-rotate']"
        :aria-label="t('a11y.toggleTheme')"
        :aria-pressed="isDarkTheme"
        @click="onThemeSwapActivate"
      >
        <input
          type="checkbox"
          class="theme-controller"
          value="business"
          tabindex="-1"
          aria-hidden="true"
          :checked="isDarkTheme"
        />
        <span class="swap-off" aria-hidden="true">
          <svg class="fill-current" :class="[ICON_SIZE_CLASS[5]]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>{{ t("settings.preferences.lightTheme") }}</title>
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
        </span>
        <span class="swap-on" aria-hidden="true">
          <svg class="fill-current" :class="[ICON_SIZE_CLASS[5]]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <title>{{ t("settings.preferences.darkTheme") }}</title>
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z" />
          </svg>
        </span>
      </button>
      <details ref="userMenu" class="dropdown dropdown-end" @toggle="syncUserMenuState">
        <summary 
          :class="[GHOST_ACTION_SQUARE_CLASS, TOUCH_TARGET_MIN_CLASS]"
          :aria-label="t('a11y.userMenu')"
          :aria-controls="userMenuId"
          :aria-expanded="isUserMenuOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" :class="ICON_SIZE_CLASS.sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </summary>
        <ul 
          :id="userMenuId"
          :class="SHELL_NAVBAR_DROPDOWN_CLASS"
          :aria-label="t('a11y.userMenu')"
        >
          <li>
            <NuxtLink
              :to="APP_ROUTES.settings"
              class="flex items-center"
              :class="[FLEX_GAP_TOKEN_CLASS.gap2, TOUCH_TARGET_MIN_CLASS]"
              :aria-label="t('nav.settings')"
              @click="closeUserMenu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" :class="[ICON_SIZE_CLASS.sm, 'shrink-0']" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ t("nav.settings") }}
            </NuxtLink>
          </li>
          <li class="menu-title">{{ t("a11y.localeSwitcher") }}</li>
          <li v-for="loc in availableLocales" :key="loc">
            <button 
              type="button"
              class="text-start"
              :class="[FLUID_WIDTH_CLASS, TOUCH_TARGET_MIN_CLASS, { active: locale === loc }]"
              :aria-label="t('a11y.localeOptionAria', { locale: getLocaleLabel(loc) })"
              :disabled="locale === loc"
              @click="selectLocale(loc)"
            >
              {{ getLocaleLabel(loc) }}
            </button>
          </li>
        </ul>
      </details>
    </div>
  </nav>
</template>
