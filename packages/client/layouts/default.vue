<script setup lang="ts">
const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="bao-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-h-screen">
      <AppNavbar />
      <main id="app-main-content" class="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
        <slot />
      </main>
    </div>
    <aside class="drawer-side is-drawer-close:overflow-visible z-40" aria-label="Sidebar navigation">
      <label for="bao-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <div class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64 transition-all duration-200">
        <AppSidebar />
      </div>
    </aside>
    <AppDock />
  </div>
</template>
