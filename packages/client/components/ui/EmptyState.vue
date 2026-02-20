<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    /** Translation key for the empty state title */
    titleKey: string;
    /** Translation key for the description (supports interpolation) */
    descriptionKey: string;
    /** Optional translation key for CTA button label */
    ctaLabelKey?: string;
    /** Optional route path for CTA button */
    ctaTo?: string;
    /** Optional icon (emoji or icon name). Default: document icon SVG path */
    icon?: string;
  }>(),
  {
    ctaLabelKey: "",
    ctaTo: "",
    icon: "",
  },
);

const { t } = useI18n();

const hasCta = computed(
  () => (props.ctaLabelKey ?? "").trim().length > 0 && (props.ctaTo ?? "").trim().length > 0,
);
</script>

<template>
  <div class="card card-border bg-base-200">
    <div class="card-body items-center text-center gap-3 py-8">
      <div
        v-if="icon"
        class="text-4xl opacity-60"
        aria-hidden="true"
      >
        {{ icon }}
      </div>
      <div
        v-else
        class="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center opacity-60"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-base-content"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 class="card-title justify-center text-lg">
        {{ t(titleKey) }}
      </h2>
      <p class="text-sm text-base-content/70 max-w-md">
        {{ t(descriptionKey) }}
      </p>
      <div v-if="hasCta" class="card-actions justify-center mt-2">
        <NuxtLink :to="ctaTo" class="btn btn-primary" :aria-label="t(ctaLabelKey)">
          {{ t(ctaLabelKey) }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
