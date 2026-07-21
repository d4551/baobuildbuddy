<script setup lang="ts">
import { AUTH_CARD_SHELL_CLASS, AUTH_SHELL_OUTER_CLASS } from "~/constants/layout";

const { initTheme, theme, applySystemThemePreferenceIfUnset } = useTheme();

// Cookie path during setup so SSR HTML matches client first paint.
initTheme();

onMounted(() => {
  applySystemThemePreferenceIfUnset();
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
