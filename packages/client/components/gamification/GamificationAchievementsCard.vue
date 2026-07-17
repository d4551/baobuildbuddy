<script setup lang="ts">
import type { Achievement } from "@bao/shared/types/gamification";
import SectionGrid from "~/components/ui/SectionGrid.vue";

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
        <SectionGrid grid-token="fourColumnFromTwo">
          <AchievementBadge
            v-for="achievement in unlockedAchievements"
            :key="achievement.id"
            :achievement="achievement"
            class="card border-2 border-success bg-base-100 shadow-lg"
          />
        </SectionGrid>
      </div>

      <div v-if="lockedAchievements.length">
        <h3 class="mb-3 font-semibold text-muted">{{ t("gamificationPage.achievementsLockedLabel") }}</h3>
        <SectionGrid grid-token="fourColumnFromTwo">
          <AchievementBadge
            v-for="achievement in lockedAchievements"
            :key="achievement.id"
            :achievement="achievement"
          />
        </SectionGrid>
      </div>
    </div>
  </section>
</template>
