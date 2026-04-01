<script setup lang="ts">
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
    ? "alert alert-warning sm:alert-horizontal"
    : "alert alert-error sm:alert-horizontal",
);

const hasRetry = computed(
  () => props.retryLabel.trim().length > 0 && props.retryAriaLabel.trim().length > 0,
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
    <div class="min-w-0 flex-1">
      <h3 v-if="title" class="font-semibold">
        {{ title }}
      </h3>
      <p :class="title ? 'text-sm' : undefined">
        {{ message }}
      </p>
    </div>
    <button
      v-if="hasRetry"
      type="button"
      class="btn btn-sm btn-ghost shrink-0"
      :aria-label="retryAriaLabel"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
