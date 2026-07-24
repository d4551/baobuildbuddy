<script setup lang="ts">
import {
  ALERT_VARIANT_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  SVG_STROKE_WIDTH_DEFAULT,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = withDefaults(
  defineProps<{
    title?: string;
    message: string;
    retryLabel?: string;
    retryAriaLabel?: string;
    severity?: "error" | "warning";
  }>(),
  {
    title: "",
    retryLabel: "",
    retryAriaLabel: "",
    severity: "error",
  },
);

const emit = defineEmits<{
  retry: [];
}>();

const alertClass = computed(() =>
  props.severity === "warning"
    ? `alert ${ALERT_VARIANT_CLASS.warning} sm:alert-horizontal`
    : `alert ${ALERT_VARIANT_CLASS.error} sm:alert-horizontal`,
);

const hasRetry = computed(
  () => props.retryLabel.trim().length > 0 && props.retryAriaLabel.trim().length > 0,
);
</script>

<template>
  <div :class="alertClass" role="alert">
    <svg class="shrink-0" :class="[ICON_SIZE_CLASS[6]]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div class="flex-1" :class="[TRUNCATE_FLEX_CHILD_CLASS]">
      <h3 v-if="title" class="font-semibold">
        {{ title }}
      </h3>
      <p :class="[title ? '' : undefined, TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ message }}
      </p>
    </div>
    <button 
      v-if="hasRetry"
      type="button"
      :class="[GHOST_ACTION_DENSE_CLASS, 'shrink-0']"
      :aria-label="retryAriaLabel"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
