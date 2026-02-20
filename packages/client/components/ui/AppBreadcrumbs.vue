<script setup lang="ts">
interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

const props = withDefaults(
  defineProps<{
    crumbs: readonly BreadcrumbItem[];
    sizeClass?: string;
  }>(),
  {
    sizeClass: "text-sm",
  },
);

const crumbs = toRef(props, "crumbs");
const sizeClass = toRef(props, "sizeClass");

const lastCrumbIndex = computed(() => crumbs.value.length - 1);
</script>

<template>
  <nav class="breadcrumbs" :class="sizeClass" aria-label="Breadcrumb">
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
