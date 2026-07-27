<script setup lang="ts">
import { AUTH_CARD_SHELL_CLASS, AUTH_SHELL_OUTER_CLASS } from "~/constants/layout";
import UiGlassCard from "~/components/ui/UiGlassCard.vue";

const { initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <main :class="AUTH_SHELL_OUTER_CLASS">
    <!--
      variant="solid" keeps the onboarding card an opaque content plane (design.md
      §4) while still routing through the card primitive, so it inherits the
      shared radius, border, and elevation instead of hand-composing them. The
      previous `card ... bg-base-100 shadow-lg` was the last card surface in the
      app built outside UiGlassCard.
    -->
    <UiGlassCard variant="solid" :extra-class="AUTH_CARD_SHELL_CLASS">
      <div class="card-body">
        <slot />
      </div>
    </UiGlassCard>
    <ToastContainer />
  </main>
</template>
