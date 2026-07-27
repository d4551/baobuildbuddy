<script setup lang="ts">
import {
  PAGE_HERO_ASIDE_CLASS,
  PAGE_HERO_CONTENT_COMFORTABLE_CLASS,
  PAGE_HERO_CONTENT_COMPACT_CLASS,
  PAGE_HERO_SECTION_CLASS,
} from "~/constants/layout";

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
    /**
     * Force the title onto its own line. `hasAside` covers heroes that surrender part of
     * their row to an aside; a hero rendered inside an already-narrow grid column has the
     * same problem from the page's layout instead, and only the consumer knows that.
     */
    stackHeader?: boolean;
  }>(),
  {
    description: "",
    headingTag: "h1",
    descriptionClass: "",
    density: "compact",
    stackHeader: false,
  },
);

const slots = useSlots();

const heroContentClass = computed(() =>
  props.density === "comfortable"
    ? PAGE_HERO_CONTENT_COMFORTABLE_CLASS
    : PAGE_HERO_CONTENT_COMPACT_CLASS,
);
const hasAside = computed(() => Boolean(slots.aside));
const stacksHeader = computed(() => props.stackHeader || hasAside.value);
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
        :stacked="stacksHeader"
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
