<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { EMPTY_STATE_STACK_CLASS } from "~/constants/layout";

const props = withDefaults(
  defineProps<{
    /** Translation key for the empty state title */
    titleKey: string;
    /** Translation key for the description (supports interpolation) */
    descriptionKey: string;
    /** Optional translation key for primary CTA button label */
    ctaLabelKey?: string;
    /** Optional route path for CTA button (link mode) */
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

const emit = defineEmits<{
  cta: [];
}>();

const { t } = useI18n();

const hasCtaLabel = computed(() => (props.ctaLabelKey ?? "").trim().length > 0);
const hasCtaLink = computed(() => hasCtaLabel.value && (props.ctaTo ?? "").trim().length > 0);
const hasCtaButton = computed(() => hasCtaLabel.value && (props.ctaTo ?? "").trim().length === 0);
</script>

<template>
  <div :class="EMPTY_STATE_STACK_CLASS">
    <div
      v-if="icon"
      class="text-4xl text-muted"
      aria-hidden="true"
    >
      {{ icon }}
    </div>
    <IconDocumentText
      v-else
      class="h-16 w-16 shrink-0 text-muted"
    />
    <h3 class="text-lg font-semibold">
      {{ t(titleKey) }}
    </h3>
    <p class="max-w-sm text-muted">
      {{ t(descriptionKey) }}
    </p>
    <NuxtLink
      v-if="hasCtaLink"
      :to="ctaTo"
      class="btn btn-primary mt-2"
      :aria-label="t(ctaLabelKey)"
    >
      {{ t(ctaLabelKey) }}
    </NuxtLink>
    <button
      v-else-if="hasCtaButton"
      type="button"
      class="btn btn-primary mt-2"
      :aria-label="t(ctaLabelKey)"
      @click="emit('cta')"
    >
      {{ t(ctaLabelKey) }}
    </button>
    <div v-if="$slots.actions" class="mt-2 flex flex-wrap items-center justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
