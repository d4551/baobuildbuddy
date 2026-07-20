<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  EMPTY_STATE_STACK_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = withDefaults(
  defineProps<{
    /** Translation key for the empty state title */
    titleKey: string;
    /** Translation key for the description (supports interpolation) */
    descriptionKey: string;
    /** Optional translation key for primary CTA button label */
    ctaLabelKey?: string;
    /** Optional aria-label key (defaults to ctaLabelKey when omitted) */
    ctaAriaKey?: string;
    /** Optional route path for CTA button (link mode) */
    ctaTo?: string;
    /** Optional icon (emoji or icon name). Default: document icon SVG path */
    icon?: string;
  }>(),
  {
    ctaLabelKey: "",
    ctaAriaKey: "",
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
const ctaAriaLabel = computed(() => {
  const ariaKey = (props.ctaAriaKey ?? "").trim();
  const labelKey = (props.ctaLabelKey ?? "").trim();
  return t(ariaKey.length > 0 ? ariaKey : labelKey);
});
</script>

<template>
  <div :class="EMPTY_STATE_STACK_CLASS">
    <div class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xl4]" v-if="icon" aria-hidden="true">
      {{ icon }}
    </div>
    <IconDocumentText class="shrink-0 text-muted" :class="[ICON_SIZE_CLASS['8']]" v-else aria-hidden="true"/>
    <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.base]">
      {{ t(titleKey) }}
    </h3>
    <!-- CTAs before body copy so first paint @320 clears the dock. -->
    <div
      class="flex w-full flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
      :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
    >
      <slot name="actions" />
      <NuxtLink
        :class="[PRIMARY_ACTION_CLASS]"
        v-if="hasCtaLink"
        :to="ctaTo"
        :aria-label="ctaAriaLabel"
      >
        {{ t(ctaLabelKey) }}
      </NuxtLink>
      <button
        :class="[PRIMARY_ACTION_CLASS]"
        v-else-if="hasCtaButton"
        type="button"
        :aria-label="ctaAriaLabel"
        @click="emit('cta')"
      >
        {{ t(ctaLabelKey) }}
      </button>
    </div>
    <p class="max-w-sm text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
      {{ t(descriptionKey) }}
    </p>
  </div>
</template>
