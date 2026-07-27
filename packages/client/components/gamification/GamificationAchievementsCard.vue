<script setup lang="ts">
import type { Achievement } from "@bao/shared/types/gamification";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { MARGIN_TOKEN_CLASS, SURFACE_GLASS_CARD_CLASS } from "~/constants/layout";

defineProps<{
  unlockedAchievements: readonly Achievement[];
  lockedAchievements: readonly Achievement[];
}>();

const { t } = useI18n();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <h2 class="card-title" :class="[MARGIN_TOKEN_CLASS.mb4]">{{ t("gamificationPage.achievementsTitle") }}</h2>

      <div v-if="unlockedAchievements.length" :class="[MARGIN_TOKEN_CLASS.mb6]">
        <h3 class="font-semibold text-success" :class="[MARGIN_TOKEN_CLASS.mb3]">{{ t("gamificationPage.achievementsUnlockedLabel") }}</h3>
        <SectionGrid grid-token="fourColumnFromTwo">
          <!--
            No surface classes injected here: AchievementBadge owns the unlocked
            state (primary ring, filled icon badge, success check) and the locked
            state (glass-disabled). The previous `card border-2 border-success
            bg-base-100` never rendered — the component's own `card-border` won the
            cascade, so the success border was invisible while also duplicating
            `glass-interactive`.
          -->
          <AchievementBadge
            v-for="achievement in unlockedAchievements"
            :key="achievement.id"
            :achievement="achievement"
          />
        </SectionGrid>
      </div>

      <div v-if="lockedAchievements.length">
        <h3 class="font-semibold text-muted" :class="[MARGIN_TOKEN_CLASS.mb3]">{{ t("gamificationPage.achievementsLockedLabel") }}</h3>
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
