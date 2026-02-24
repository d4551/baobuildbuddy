<script setup lang="ts">
import { UI_GRID_CLASS_BY_TOKEN, type UiGridToken } from "~/constants/ui-layout";

type SectionGridTag = "div" | "section";

const props = withDefaults(
  defineProps<{
    gridToken?: UiGridToken;
    tag?: SectionGridTag;
    extraClass?: string;
  }>(),
  {
    gridToken: "single",
    tag: "div",
    extraClass: "",
  },
);

const sectionGridClass = computed(() => [
  UI_GRID_CLASS_BY_TOKEN[props.gridToken],
  props.extraClass,
]);
</script>

<template>
  <component :is="tag" :class="sectionGridClass">
    <slot />
  </component>
</template>
