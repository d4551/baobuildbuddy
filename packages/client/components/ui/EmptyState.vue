<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  EMPTY_STATE_STACK_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
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
    <div class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xl4]" v-if="icon" aria-hidden="true">
      {{ icon }}
    </div>
    <IconDocumentText class="shrink-0 text-muted" :class="[ICON_SIZE_CLASS[16]]" v-else aria-hidden="true"/>
    <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
      {{ t(titleKey) }}
    </h3>
    <p class="max-w-sm text-muted">
      {{ t(descriptionKey) }}
    </p>
    <NuxtLink class="btn btn-primary" :class="[MARGIN_TOKEN_CLASS.mt2]" v-if="hasCtaLink" :to="ctaTo" :aria-label="t(ctaLabelKey)">
      {{ t(ctaLabelKey) }}
    </NuxtLink>
    <button class="btn btn-primary" :class="[MARGIN_TOKEN_CLASS.mt2]" v-else-if="hasCtaButton" type="button" :aria-label="t(ctaLabelKey)" @click="emit('cta')">
      {{ t(ctaLabelKey) }}
    </button>
    <div class="flex flex-wrap items-center justify-center" :class="[MARGIN_TOKEN_CLASS.mt2, FLEX_GAP_TOKEN_CLASS.gap2]" v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>
