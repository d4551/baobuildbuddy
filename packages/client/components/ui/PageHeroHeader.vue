<script setup lang="ts">
import { PAGE_HERO_ASIDE_CLASS, PAGE_HERO_CONTENT_COMFORTABLE_CLASS, PAGE_HERO_CONTENT_COMPACT_CLASS, PAGE_HERO_SECTION_CLASS } from "~/constants/layout";

type PageHeroDensity = "compact" | "comfortable";
type PageHeroHeadingTag = "h1" | "h2";

const props = withDefaults(
  defineProps<{
    title: string;
    titleId: string;
    description?: string;
    headingTag?: PageHeroHeadingTag;
    descriptionClass?: string;
    density?: PageHeroDensity;
  }>(),
  {
    description: "",
    headingTag: "h1",
    descriptionClass: "",
    density: "compact",
  },
);

const slots = useSlots();

const heroContentClass = computed(() =>
  props.density === "comfortable"
    ? PAGE_HERO_CONTENT_COMFORTABLE_CLASS
    : PAGE_HERO_CONTENT_COMPACT_CLASS,
);
const hasAside = computed(() => Boolean(slots.aside));
</script>

<template>
  <section :class="PAGE_HERO_SECTION_CLASS">
    <div :class="heroContentClass">
      <PageHeaderBlock
        :title-id="titleId"
        :title="title"
        :description="description"
        :heading-tag="headingTag"
        :description-class="descriptionClass"
      >
        <template v-if="$slots.actions" #actions>
          <slot name="actions" />
        </template>
      </PageHeaderBlock>

      <div v-if="hasAside" :class="PAGE_HERO_ASIDE_CLASS">
        <slot name="aside" />
      </div>
    </div>
  </section>
</template>
