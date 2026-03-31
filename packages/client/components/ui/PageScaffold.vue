<script setup lang="ts">
import {
  UI_SPACING_CLASS_BY_TOKEN,
  UI_WIDTH_CLASS_BY_TOKEN,
  type UiSpacingToken,
  type UiWidthToken,
} from "~/constants/ui-layout";

type PageScaffoldTag = "div" | "section" | "main";

const props = withDefaults(
  defineProps<{
    tag?: PageScaffoldTag;
    widthToken?: UiWidthToken;
    spacingToken?: UiSpacingToken;
    labelledBy?: string;
    describedBy?: string;
    extraClass?: string;
  }>(),
  {
    tag: "section",
    widthToken: "shell",
    spacingToken: "comfortable",
    labelledBy: undefined,
    describedBy: undefined,
    extraClass: "",
  },
);

const scaffoldClass = computed(() => [
  UI_WIDTH_CLASS_BY_TOKEN[props.widthToken],
  UI_SPACING_CLASS_BY_TOKEN[props.spacingToken],
  props.extraClass,
]);
</script>

<template>
  <component
    :is="tag"
    :class="scaffoldClass"
    :aria-labelledby="labelledBy"
    :aria-describedby="describedBy"
  >
    <slot />
  </component>
</template>
