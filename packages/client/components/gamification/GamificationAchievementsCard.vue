<script setup lang="ts">
import type { Achievement } from "@bao/shared";

defineProps<{
  unlockedAchievements: readonly Achievement[];
  lockedAchievements: readonly Achievement[];
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title mb-4">{{ t("gamificationPage.achievementsTitle") }}</h2>

      <div v-if="unlockedAchievements.length" class="mb-6">
        <h3 class="mb-3 font-semibold text-success">{{ t("gamificationPage.achievementsUnlockedLabel") }}</h3>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AchievementBadge
            v-for="achievement in unlockedAchievements"
            :key="achievement.id"
            :achievement="achievement"
            class="card border-2 border-success bg-base-100 shadow-lg"
          />
        </div>
      </div>

      <div v-if="lockedAchievements.length">
        <h3 class="mb-3 font-semibold text-base-content/60">{{ t("gamificationPage.achievementsLockedLabel") }}</h3>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AchievementBadge
            v-for="achievement in lockedAchievements"
            :key="achievement.id"
            :achievement="achievement"
            class="card bg-base-100 opacity-60"
          />
        </div>
      </div>
    </div>
  </section>
</template>
