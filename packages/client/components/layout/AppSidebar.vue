<script setup lang="ts">
import { APP_BRAND } from "@bao/shared";
import { getSidebarNavigationItems, isRouteActive } from "~/constants/navigation";

const route = useRoute();
const sidebarItems = getSidebarNavigationItems();
</script>

<template>
  <nav aria-label="Primary" class="w-full min-h-full">
    <ul class="menu min-h-full w-full p-4 pt-6 gap-1">
      <li class="menu-title px-2 pb-4">
        <span class="text-lg font-bold text-primary is-drawer-close:hidden">{{ APP_BRAND.name }}</span>
      </li>
      <li v-for="item in sidebarItems" :key="item.id">
        <NuxtLink
          :to="item.to"
          :class="[
            'flex items-center gap-2 is-drawer-close:tooltip is-drawer-close:tooltip-right',
            { 'menu-active': isRouteActive(route.path, item.to) },
          ]"
          :data-tip="item.label"
          :aria-current="isRouteActive(route.path, item.to) ? 'page' : undefined"
          :aria-label="item.label"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span class="is-drawer-close:hidden">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
