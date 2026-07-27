<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  PAGE_HEADER_DESCRIPTION_CLASS,
  PAGE_HEADER_OUTER_CLASS,
  PAGE_HEADER_OUTER_STACKED_CLASS,
  PAGE_HEADER_TITLE_CLASS,
} from "~/constants/layout";

type HeadingTag = "h1" | "h2";

const props = withDefaults(
  defineProps<{
    title: string;
    titleId: string;
    description?: string;
    headingTag?: HeadingTag;
    descriptionClass?: string;
    /**
     * Keep the title and actions on separate lines. Callers whose header shares a row with
     * a hero aside set this: the header only gets what the aside leaves, and a `shrink-0`
     * actions row makes the title absorb the whole shortfall.
     */
    stacked?: boolean;
  }>(),
  {
    description: "",
    headingTag: "h1",
    descriptionClass: "",
    stacked: false,
  },
);

const outerClass = computed(() =>
  props.stacked ? PAGE_HEADER_OUTER_STACKED_CLASS : PAGE_HEADER_OUTER_CLASS,
);

const hasActions = computed(() => Boolean(useSlots().actions));
const resolvedDescriptionClass = computed(() =>
  props.descriptionClass.length > 0 ? props.descriptionClass : PAGE_HEADER_DESCRIPTION_CLASS,
);
</script>

<template>
  <header :class="outerClass">
    <div class="min-w-0">
      <component :is="headingTag" :id="titleId" :class="PAGE_HEADER_TITLE_CLASS">
        {{ title }}
      </component>
      <p v-if="description" :class="resolvedDescriptionClass">{{ description }}</p>
    </div>
    <div class="flex shrink-0 flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]" v-if="hasActions">
      <slot name="actions" />
    </div>
  </header>
</template>
