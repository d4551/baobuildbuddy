<script setup lang="ts">
import { AUTH_SHELL_OUTER_CLASS, SHADOW_TOKEN_CLASS } from "~/constants/layout";

const { initTheme, theme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <main :class="AUTH_SHELL_OUTER_CLASS" :data-theme="theme">
    <!-- Static `card` class required by validate:daisyui-contracts; must match `AUTH_CARD_SHELL_CLASS` in constants/layout.ts -->
    <div class="card w-full max-w-md bg-base-100" :class="[SHADOW_TOKEN_CLASS.lg]">
      <div class="card-body">
        <slot />
      </div>
    </div>
  </main>
</template>
