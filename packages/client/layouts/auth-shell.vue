<script setup lang="ts">
import { AUTH_CARD_SHELL_CLASS, AUTH_SHELL_OUTER_CLASS } from "~/constants/layout";

const { initTheme, theme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <main :class="AUTH_SHELL_OUTER_CLASS" :data-theme="theme">
    <div :class="AUTH_CARD_SHELL_CLASS">
      <div class="card-body">
        <slot />
      </div>
    </div>
  </main>
</template>
