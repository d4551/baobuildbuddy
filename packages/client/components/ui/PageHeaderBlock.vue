<script setup lang="ts">
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
  props.descriptionClass.length > 0 ? props.descriptionClass : "text-sm text-base-content/70",
);
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-4">
    <div class="space-y-2">
      <component :is="headingTag" :id="titleId" class="text-3xl font-bold md:text-4xl">
        {{ title }}
      </component>
      <p v-if="description" :class="resolvedDescriptionClass">{{ description }}</p>
    </div>
    <div v-if="hasActions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
