<script setup lang="ts">
import { AI_CHAT_PAGE_PATH } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  APP_DRAWER_ID,
  APP_MAIN_CONTENT_ID,
  LAYOUT_DESKTOP_MEDIA_QUERY,
  SHELL_MAIN_INNER_CLASS,
} from "~/constants/layout";

const { initTheme, theme, setTheme } = useTheme();
const { settings } = useSettings();
const { brandCssVars } = useBrand();
const { t } = useI18n();
const route = useRoute();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
const isDesktopViewport = ref(false);
let desktopMediaQueryList: MediaQueryList | null = null;
let removeMediaQueryListener: (() => void) | null = null;

const shellStyle = computed(() => brandCssVars.value);

const showFloatingChatWidget = computed(() => !route.path.startsWith(AI_CHAT_PAGE_PATH));

useKeyboardShortcuts();

function syncDrawerForViewport(isDesktop: boolean): void {
  isDesktopViewport.value = isDesktop;
  isDrawerOpen.value = isDesktop;
}

onMounted(() => {
  initTheme(settings.value?.theme);

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

watch(
  () => settings.value?.theme,
  (nextTheme) => {
    if (nextTheme) {
      setTheme(nextTheme, { persistLocal: false });
    }
  },
  { immediate: true },
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
  <div class="drawer lg:drawer-open min-h-screen" :data-theme="theme" :style="shellStyle">
    <input
      :id="APP_DRAWER_ID"
      type="checkbox"
      class="drawer-toggle"
      v-model="isDrawerOpen"
      aria-hidden="true"
      tabindex="-1"
    />
    <div class="drawer-content flex min-h-screen flex-col">
      <a :href="`#${APP_MAIN_CONTENT_ID}`" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn btn-primary btn-sm" :aria-label="t('a11y.skipToContent')">{{ t("a11y.skipToContent") }}</a>
      <AppNavbar />
      <main :id="APP_MAIN_CONTENT_ID" class="flex flex-1 flex-col">
        <div :class="SHELL_MAIN_INNER_CLASS">
          <slot />
        </div>
      </main>
      <ToastContainer />
    </div>
    <div class="drawer-side is-drawer-close:overflow-visible z-20">
      <label
        :for="APP_DRAWER_ID"
        class="drawer-overlay"
        :aria-label="t('a11y.closeSidebar')"
        :aria-controls="APP_DRAWER_ID"
      ></label>
      <aside
        class="flex min-h-full flex-col items-start bg-base-200 transition-all duration-200 is-drawer-close:w-14 is-drawer-open:w-64"
        :aria-label="t('a11y.sidebarNavigation')"
      >
        <AppSidebar />
      </aside>
    </div>
    <ClientOnly>
      <AppDock />
      <LazyQuickActionFab />
      <LazyFloatingChatWidget v-if="showFloatingChatWidget" />
    </ClientOnly>
  </div>
</template>
