<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    message: string;
    retryLabel: string;
    retryAriaLabel: string;
    severity?: "error" | "warning";
  }>(),
  { severity: "error" },
);

const emit = defineEmits<{
  retry: [];
}>();

const alertClass = computed(() =>
  props.severity === "warning"
    ? "alert alert-warning sm:alert-horizontal"
    : "alert alert-error sm:alert-horizontal",
);
</script>

<template>
  <div :class="alertClass" role="alert">
    <svg
      class="h-6 w-6 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <span>{{ message }}</span>
    <button
      type="button"
      class="btn btn-sm btn-ghost shrink-0"
      :aria-label="retryAriaLabel"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
