<script setup lang="ts">
import { AUTH_CARD_SHELL_CLASS, AUTH_SHELL_OUTER_CLASS } from "~/constants/layout";

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <main :class="AUTH_SHELL_OUTER_CLASS">
    <div :class="AUTH_CARD_SHELL_CLASS">
      <div class="card-body">
        <slot />
      </div>
    </div>
    <ToastContainer />
  </main>
</template>
