<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  APP_DRAWER_ID,
  APP_MAIN_CONTENT_ID,
  LAYOUT_DESKTOP_MEDIA_QUERY,
  SHELL_DRAWER_CLASS,
  SHELL_DRAWER_CONTENT_CLASS,
  SHELL_DRAWER_SIDE_CLASS,
  SHELL_MAIN_INNER_CLASS,
  SHELL_SIDEBAR_ASIDE_CLASS,
  SHELL_SKIP_LINK_CLASS,
} from "~/constants/layout";

const { initTheme, theme, setTheme, applySystemThemePreferenceIfUnset } = useTheme();
const { settings } = useSettings();
const { t } = useI18n();
const route = useRoute();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
const isDesktopViewport = ref(false);
let desktopMediaQueryList: MediaQueryList | null = null;
let removeMediaQueryListener: (() => void) | null = null;

// Cookie/settings path during setup — SSR and client first paint stay aligned.
initTheme(settings.value?.theme);

/**
 * Floating chat is desktop-only. Below lg the dock owns AI Chat — dual chrome
 * crowds the dock and fails Apple HIG primary-destination clarity.
 */
const showFloatingChatWidget = computed(() => {
  const path = route.path;
  if (path === APP_ROUTES.ai || path.startsWith(`${APP_ROUTES.ai}/`)) {
    return false;
  }
  return isDesktopViewport.value;
});

useKeyboardShortcuts();

function syncDrawerForViewport(isDesktop: boolean): void {
  isDesktopViewport.value = isDesktop;
  isDrawerOpen.value = isDesktop;
}

onMounted(() => {
  initTheme(settings.value?.theme);
  applySystemThemePreferenceIfUnset();

  desktopMediaQueryList = window.matchMedia(LAYOUT_DESKTOP_MEDIA_QUERY);
  const handleViewportChange = (event: MediaQueryListEvent) => {
    syncDrawerForViewport(event.matches);
  };

  syncDrawerForViewport(desktopMediaQueryList.matches);
  desktopMediaQueryList.addEventListener("change", handleViewportChange);
  removeMediaQueryListener = () => {
    desktopMediaQueryList?.removeEventListener("change", handleViewportChange);
  };
});

// Cookie + setup initTheme already applied settings.theme. Do not re-apply
// with immediate:true (SSR/client race can log hydration mismatches).
watch(
  () => settings.value?.theme,
  (nextTheme) => {
    if (nextTheme && nextTheme !== theme.value) {
      setTheme(nextTheme, { persist: false });
    }
  },
);

watch(
  () => route.fullPath,
  () => {
    if (!isDesktopViewport.value) {
      isDrawerOpen.value = false;
    }
  },
);

onUnmounted(() => {
  if (removeMediaQueryListener) {
    removeMediaQueryListener();
    removeMediaQueryListener = null;
  }
  desktopMediaQueryList = null;
});
</script>

<template>
  <div class="drawer" :class="SHELL_DRAWER_CLASS" :data-theme="theme">
    <input
      :id="APP_DRAWER_ID"
      type="checkbox"
      class="drawer-toggle"
      v-model="isDrawerOpen"
      aria-hidden="true"
      tabindex="-1"
    />
    <div class="drawer-content" :class="SHELL_DRAWER_CONTENT_CLASS">
      <a :href="`#${APP_MAIN_CONTENT_ID}`" :class="SHELL_SKIP_LINK_CLASS" :aria-label="t('a11y.skipToContent')">{{ t("a11y.skipToContent") }}</a>
      <AppNavbar />
      <main :id="APP_MAIN_CONTENT_ID" tabindex="-1" class="flex flex-1 flex-col">
        <div :class="SHELL_MAIN_INNER_CLASS">
          <slot />
        </div>
      </main>
      <ToastContainer />
    </div>
    <div class="drawer-side" :class="SHELL_DRAWER_SIDE_CLASS">
      <label
        :for="APP_DRAWER_ID"
        class="drawer-overlay"
        :aria-label="t('a11y.closeSidebar')"
        :aria-controls="APP_DRAWER_ID"
      ></label>
      <aside :class="SHELL_SIDEBAR_ASIDE_CLASS" :aria-label="t('a11y.sidebarNavigation')">
        <AppSidebar />
      </aside>
    </div>
    <!-- Dock is SSR-safe (route + i18n only). Keep outside ClientOnly so mobile
         wayfinding aria-current is present before hydration (smoke + a11y). -->
    <AppDock />
    <ClientOnly>
      <LazyQuickActionFab />
      <LazyFloatingChatWidget v-if="showFloatingChatWidget" />
    </ClientOnly>
  </div>
</template>
