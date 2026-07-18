<script setup lang="ts">
/**
 * Canonical glassmorphic card primitive. Single source for:
 *   - Glass surface (SURFACE_GLASS_CARD_CLASS)
 *   - Hover lift + shadow elevation (glass-card-hover)
 *   - Staggered entrance animation (glass-card-enter)
 *   - Interactive states: default, selected, disabled, error
 *   - Touch-optimized hit targets
 *   - Optional NuxtLink overlay for clickable cards
 *
 * All pages/components MUST consume this component instead of
 * manually composing SURFACE_GLASS_CARD_CLASS + glass-card-hover.
 * Bespoke card surfaces are forbidden — use the `variant` prop
 * for material strength (standard, strong, modal, subtle, clear, solid).
 *
 * Stagger delays are driven by pure CSS classes (glass-card-enter-N)
 * defined in assets/css/main.css — no inline style bindings.
 */
import { computed } from "vue";
import {
  SURFACE_GLASS_CARD_CLASS,
  SURFACE_GLASS_CARD_STRONG_CLASS,
  SURFACE_GLASS_CARD_MODAL_CLASS,
  SURFACE_GLASS_CARD_SELECTED_CLASS,
  SURFACE_GLASS_CARD_DISABLED_CLASS,
  SURFACE_GLASS_CARD_ERROR_CLASS,
  SURFACE_GLASS_CLEAR_CLASS,
  SURFACE_GLASS_SOLID_CLASS,
} from "~/constants/layout";

type GlassCardVariant = "standard" | "strong" | "modal" | "subtle" | "clear" | "solid";

const props = withDefaults(
  defineProps<{
    /** Material strength variant */
    variant?: GlassCardVariant;
    /** Route for NuxtLink overlay (clickable card) */
    to?: string;
    /** Aria label for the link overlay */
    linkAriaLabel?: string;
    /** Whether the card is in selected state */
    selected?: boolean;
    /** Whether the card is disabled */
    disabled?: boolean;
    /** Whether the card shows an error state */
    error?: boolean;
    /** Stagger index for entrance animation (0-based, capped at 11) */
    staggerIndex?: number;
    /** Extra class for the outer card element */
    extraClass?: string;
  }>(),
  {
    variant: "standard",
    to: "",
    linkAriaLabel: "",
    selected: false,
    disabled: false,
    error: false,
    staggerIndex: undefined,
    extraClass: "",
  },
);

const surfaceClass = computed(() => {
  const variantClassMap: Record<GlassCardVariant, string> = {
    standard: SURFACE_GLASS_CARD_CLASS,
    strong: SURFACE_GLASS_CARD_STRONG_CLASS,
    modal: SURFACE_GLASS_CARD_MODAL_CLASS,
    subtle: SURFACE_GLASS_CLEAR_CLASS,
    clear: SURFACE_GLASS_CLEAR_CLASS,
    solid: SURFACE_GLASS_SOLID_CLASS,
  };
  return variantClassMap[props.variant] ?? SURFACE_GLASS_CARD_CLASS;
});

/** Clamp stagger index to 0–11 so it always maps to a defined CSS delay class. */
const staggerClass = computed(() =>
  props.staggerIndex !== undefined
    ? `glass-card-enter glass-card-enter-${Math.min(Math.max(props.staggerIndex, 0), 11)}`
    : "",
);

const cardClass = computed(() => [
  surfaceClass.value,
  "glass-card-hover",
  "relative overflow-hidden",
  staggerClass.value,
  props.selected ? SURFACE_GLASS_CARD_SELECTED_CLASS : "",
  props.disabled ? SURFACE_GLASS_CARD_DISABLED_CLASS : "",
  props.error ? SURFACE_GLASS_CARD_ERROR_CLASS : "",
  props.extraClass,
]);
</script>

<template>
  <article :class="cardClass">
    <!-- Link overlay for clickable cards -->
    <NuxtLink
      v-if="to"
      :to="to"
      class="absolute inset-0 z-10 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      :aria-label="linkAriaLabel"
    />
    <!-- Content slot -->
    <div class="relative z-0">
      <slot />
    </div>
  </article>
</template>
