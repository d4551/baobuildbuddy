<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  PAGE_HEADER_DESCRIPTION_CLASS,
  PAGE_HEADER_OUTER_CLASS,
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
  }>(),
  {
    description: "",
    headingTag: "h1",
    descriptionClass: "",
  },
);

const hasActions = computed(() => Boolean(useSlots().actions));
const resolvedDescriptionClass = computed(() =>
  props.descriptionClass.length > 0 ? props.descriptionClass : PAGE_HEADER_DESCRIPTION_CLASS,
);
</script>

<template>
  <header :class="PAGE_HEADER_OUTER_CLASS">
    <div class="min-w-0">
      <component :is="headingTag" :id="titleId" :class="PAGE_HEADER_TITLE_CLASS">
        {{ title }}
      </component>
      <p v-if="description" :class="resolvedDescriptionClass">{{ description }}</p>
    </div>
    <div
      v-if="hasActions"
      class="flex w-full shrink-0 flex-wrap sm:w-auto"
      :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
