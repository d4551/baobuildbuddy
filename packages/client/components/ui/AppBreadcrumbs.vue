<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { BreadcrumbItem } from "~/types/ui-components";

const props = withDefaults(
  defineProps<{
    crumbs: readonly BreadcrumbItem[];
    sizeClass?: string;
    /**
     * i18n key for the landmark's accessible name. The navbar renders a single-item
     * section indicator through this component, so both were announced as "Breadcrumb"
     * and landmark navigation could not tell the two apart. Callers that are not a
     * hierarchy trail pass their own key.
     */
    labelKey?: string;
  }>(),
  {
    sizeClass: "text-sm",
    labelKey: "a11y.breadcrumbs",
  },
);

const crumbs = toRef(props, "crumbs");
const sizeClass = toRef(props, "sizeClass");
const labelKey = toRef(props, "labelKey");
const { t } = useI18n();

const lastCrumbIndex = computed(() => crumbs.value.length - 1);
</script>

<template>
  <nav class="breadcrumbs" :class="sizeClass" :aria-label="t(labelKey)">
    <ul>
      <li v-for="(crumb, index) in crumbs" :key="`${crumb.label}-${index}`">
        <NuxtLink v-if="crumb.to && index !== lastCrumbIndex" :to="crumb.to">
          {{ crumb.label }}
        </NuxtLink>
        <span v-else :aria-current="index === lastCrumbIndex ? 'page' : undefined">
          {{ crumb.label }}
        </span>
      </li>
    </ul>
  </nav>
</template>
