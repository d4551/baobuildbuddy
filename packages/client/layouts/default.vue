<script setup lang="ts">
import { AI_CHAT_PAGE_PATH } from "@bao/shared/constants/ai-chat";
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

const { initTheme, theme, setTheme } = useTheme();
const { settings } = useSettings();
const { t } = useI18n();
const route = useRoute();
const isDrawerOpen = useState<boolean>(APP_DRAWER_ID, () => false);
const isDesktopViewport = ref(false);
let desktopMediaQueryList: MediaQueryList | null = null;
let removeMediaQueryListener: (() => void) | null = null;

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
      setTheme(nextTheme, { persist: false });
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
      <main :id="APP_MAIN_CONTENT_ID" class="flex flex-1 flex-col">
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
    <ClientOnly>
      <AppDock />
      <LazyQuickActionFab />
      <LazyFloatingChatWidget v-if="showFloatingChatWidget" />
    </ClientOnly>
  </div>
</template>
