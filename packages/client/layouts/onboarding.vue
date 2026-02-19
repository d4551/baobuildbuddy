<script setup lang="ts">
const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="w-full max-w-2xl p-6">
      <slot />
    </div>
  </div>
</template>
