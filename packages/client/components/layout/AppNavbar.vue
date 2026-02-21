<script setup lang="ts">
import { APP_BRAND, APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { APP_DRAWER_ID } from "~/constants/layout";

const { theme, toggleTheme } = useTheme();
const { t, locale, availableLocales } = useI18n();

const localeDisplayNames = computed(
  () =>
    new Intl.DisplayNames([locale.value], {
      type: "language",
    }),
);

const getLocaleLabel = (localeCode: string): string => {
  const [languageCode] = localeCode.split("-");
  const displayName = languageCode ? localeDisplayNames.value.of(languageCode) : undefined;
  return displayName ?? localeCode;
};
</script>

<template>
  <div class="navbar sticky top-0 z-30 border-b border-base-300 bg-base-200/95 backdrop-blur supports-[backdrop-filter]:bg-base-200/80">
    <div class="navbar-start">
      <label
        :for="APP_DRAWER_ID"
        class="btn btn-ghost btn-circle drawer-button lg:hidden"
        :aria-label="t('a11y.toggleSidebar')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <NuxtLink :to="APP_ROUTES.dashboard" class="btn btn-ghost gap-2 text-xl font-bold text-primary lg:hidden">
        <img :src="APP_BRAND.logoPath" alt="" aria-hidden="true" class="h-5 w-5 shrink-0 rounded-sm" />
        <span>{{ APP_BRAND.name }}</span>
      </NuxtLink>
    </div>
    <div class="navbar-center hidden lg:flex">
      <span class="text-sm text-base-content/60">{{ t("app.tagline") }}</span>
    </div>
    <div class="navbar-end gap-1">
      <label class="swap swap-rotate btn btn-ghost btn-circle" :aria-label="t('a11y.toggleTheme')">
        <input
          type="checkbox"
          class="theme-controller"
          value="bao-dark"
          :checked="theme === 'bao-dark'"
          :aria-label="t('a11y.toggleTheme')"
          @change="toggleTheme()"
        />
        <svg class="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
        </svg>
        <svg class="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z" />
        </svg>
      </label>
      <div class="dropdown dropdown-end">
        <button type="button" class="btn btn-ghost btn-circle" :aria-label="t('a11y.localeSwitcher')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12 6a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
        </button>
        <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-50 mt-2 w-40 p-2 shadow-lg" role="listbox" :aria-label="t('a11y.localeSwitcher')">
          <li v-for="loc in availableLocales" :key="loc">
            <button
              type="button"
              class="w-full text-left"
              :class="{ 'active': locale === loc }"
              role="option"
              :aria-selected="locale === loc"
              :aria-label="t('a11y.localeOptionAria', { locale: getLocaleLabel(loc) })"
              @click="locale = loc"
            >
              {{ getLocaleLabel(loc) }}
            </button>
          </li>
        </ul>
      </div>
      <NuxtLink :to="APP_ROUTES.settings" class="btn btn-ghost btn-circle" :aria-label="t('a11y.openSettings')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>
