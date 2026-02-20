<script setup lang="ts">
import { getDockNavigationItems, isRouteActive } from "~/constants/navigation";

const route = useRoute();
const dockItems = getDockNavigationItems();
</script>

<template>
  <nav class="dock lg:hidden" aria-label="Mobile primary navigation">
    <NuxtLink
      v-for="item in dockItems"
      :key="item.id"
      :to="item.to"
      :class="{ 'dock-active': isRouteActive(route.path, item.to) }"
      :aria-current="isRouteActive(route.path, item.to) ? 'page' : undefined"
      :aria-label="item.label"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
      </svg>
      <span class="dock-label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
