<script setup lang="ts">
type LoadingSkeletonVariant = "text" | "cards" | "stats";

withDefaults(
  defineProps<{
    lines?: number;
    width?: string;
    variant?: LoadingSkeletonVariant;
  }>(),
  {
    lines: 3,
    width: "w-full",
    variant: "text",
  },
);
</script>

<template>
  <div v-if="variant === 'cards'" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    <div v-for="index in 6" :key="index" class="card card-border bg-base-100">
      <div class="card-body gap-3">
        <div class="skeleton h-5 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-4 w-full"></div>
        <div class="skeleton h-4 w-5/6"></div>
        <div class="mt-2 flex gap-2">
          <div class="skeleton h-6 w-16"></div>
          <div class="skeleton h-6 w-20"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="variant === 'stats'" class="stats stats-vertical w-full gap-4 bg-base-100 p-4 shadow md:stats-horizontal">
    <div v-for="index in 3" :key="index" class="stat">
      <div class="skeleton mb-2 h-4 w-20"></div>
      <div class="skeleton h-8 w-16"></div>
      <div class="skeleton mt-2 h-3 w-24"></div>
    </div>
  </div>

  <div v-else class="flex flex-col gap-3">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton h-4"
      :class="[i === lines ? 'w-3/4' : width]"
    />
  </div>
</template>
