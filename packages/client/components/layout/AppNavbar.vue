<script setup lang="ts">
import { THEME_NAMES } from "@bao/shared/constants/branding";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { computed, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { resolveLocaleLabel } from "~/constants/i18n";
import { APP_DRAWER_ID, ICON_SIZE_CLASS, RADIUS_TOKEN_CLASS, SHELL_NAVBAR_CLASS, SHELL_NAVBAR_DROPDOWN_CLASS } from "~/constants/layout";
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
const getLocaleLabel = (localeCode: string): string => resolveLocaleLabel(t, localeCode);
let themePersistRequestId = 0;

function closeUserMenu(): void {
  if (userMenuRef.value) {
    userMenuRef.value.open = false;
    isUserMenuOpen.value = false;
  }
}

function onWindowScroll(): void {
  isScrolled.value = window.scrollY > 8;
}

function selectLocale(nextLocale: string): void {
  locale.value = nextLocale;
  closeUserMenu();
}

function syncUserMenuState(): void {
  isUserMenuOpen.value = userMenuRef.value?.open ?? false;
}

async function onThemeControllerChange(event: Event): Promise<void> {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) return;
  const previousTheme = theme.value;
  const nextTheme = target.checked ? THEME_NAMES.dark : THEME_NAMES.light;
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
    target.checked = previousTheme === THEME_NAMES.dark;
    return;
  }
  setTheme(nextTheme, { persist: true });
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
    <div class="navbar-start flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
      <label
        :for="APP_DRAWER_ID"
        role="button"
        tabindex="0"
        class="btn btn-ghost btn-circle drawer-button shrink-0 lg:hidden"
        :aria-label="t('a11y.toggleSidebar')"
        :aria-controls="APP_DRAWER_ID"
        :aria-expanded="isDrawerOpen"
        @keydown.enter.prevent="setDrawerToggleState(!isDrawerOpen)"
        @keydown.space.prevent="setDrawerToggleState(!isDrawerOpen)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" :class="ICON_SIZE_CLASS.sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <NuxtLink
        :to="APP_ROUTES.dashboard"
        class="btn btn-ghost shrink-0 gap-2 text-xl font-bold text-primary lg:hidden"
      >
        <img :src="resolvedBrand.logoPath" alt="" aria-hidden="true" :class="[ICON_SIZE_CLASS.sm, 'shrink-0 ', RADIUS_TOKEN_CLASS.sm]" />
        <span>{{ resolvedBrand.name }}</span>
        <span v-if="mobileSectionLabel" class="text-sm font-medium text-secondary before:content-['/'] before:mx-1 before:text-muted">{{ mobileSectionLabel }}</span>
      </NuxtLink>
      <div class="hidden min-w-0 flex-1 lg:block">
        <AppBreadcrumbs :crumbs="navbarBreadcrumbs" class="truncate" />
      </div>
    </div>
    <div class="navbar-center hidden lg:flex transition-[opacity,height] duration-[var(--motion-standard)] ease-[var(--ease-response)]" :class="{ 'overflow-hidden opacity-0 max-h-0': isScrolled }">
      <span class="text-sm text-muted">{{ resolvedBrand.content.tagline }}</span>
    </div>
    <div class="navbar-end gap-1">
      <label class="swap swap-rotate btn btn-ghost btn-circle">
        <input
          type="checkbox"
          class="theme-controller"
          value="business"
          :checked="isDarkTheme"
          :aria-label="t('a11y.toggleTheme')"
          :aria-pressed="isDarkTheme"
          @change="onThemeControllerChange"
        />
        <span class="swap-off" aria-hidden="true">
          <svg class="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
        </span>
        <span class="swap-on" aria-hidden="true">
          <svg class="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z" />
          </svg>
        </span>
      </label>
      <details ref="userMenu" class="dropdown dropdown-end" @toggle="syncUserMenuState">
        <summary
          class="btn btn-ghost btn-circle"
          :aria-label="t('a11y.userMenu')"
          :aria-controls="userMenuId"
          :aria-expanded="isUserMenuOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" :class="ICON_SIZE_CLASS.sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </summary>
        <ul
          :id="userMenuId"
          :class="SHELL_NAVBAR_DROPDOWN_CLASS"
          :aria-label="t('a11y.userMenu')"
        >
          <li>
            <NuxtLink :to="APP_ROUTES.settings" class="flex items-center gap-2" @click="closeUserMenu">
              <svg xmlns="http://www.w3.org/2000/svg" :class="[ICON_SIZE_CLASS.sm, 'shrink-0']" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {{ t("nav.settings") }}
            </NuxtLink>
          </li>
          <li class="menu-title">{{ t("a11y.localeSwitcher") }}</li>
          <li v-for="loc in availableLocales" :key="loc">
            <button
              type="button"
              class="w-full text-left"
              :class="{ active: locale === loc }"
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
