<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { initTheme } = useTheme();
const { t } = useI18n();

useKeyboardShortcuts();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input
      id="bao-drawer"
      type="checkbox"
      class="drawer-toggle"
      :aria-label="t('a11y.toggleSidebarNavigation')"
    />
    <div class="drawer-content flex flex-col min-h-screen">
      <a href="#app-main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 btn btn-primary btn-sm">{{ t("a11y.skipToContent") }}</a>
      <AppNavbar />
      <main id="app-main-content" class="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
        <slot />
      </main>
      <ToastContainer />
    </div>
    <aside class="drawer-side is-drawer-close:overflow-visible z-40" :aria-label="t('a11y.sidebarNavigation')">
      <label for="bao-drawer" :aria-label="t('a11y.closeSidebar')" class="drawer-overlay"></label>
      <div class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64 transition-all duration-200">
        <AppSidebar />
      </div>
    </aside>
    <AppDock />
    <QuickActionFab />
    <FloatingChatWidget />
  </div>
</template>
