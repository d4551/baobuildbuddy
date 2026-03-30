<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { EMPTY_STATE_STACK_CLASS } from "~/constants/layout";

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
  <div :class="EMPTY_STATE_STACK_CLASS">
    <div
      v-if="icon"
      class="text-4xl text-base-content/40"
      aria-hidden="true"
    >
      {{ icon }}
    </div>
    <IconDocumentText
      v-else
      class="h-16 w-16 shrink-0 text-base-content/20"
    />
    <h3 class="text-lg font-semibold">
      {{ t(titleKey) }}
    </h3>
    <p class="max-w-sm text-base-content/60">
      {{ t(descriptionKey) }}
    </p>
    <NuxtLink
      v-if="hasCta"
      :to="ctaTo"
      class="btn btn-primary mt-6"
      :aria-label="t(ctaLabelKey)"
    >
      {{ t(ctaLabelKey) }}
    </NuxtLink>
  </div>
</template>
