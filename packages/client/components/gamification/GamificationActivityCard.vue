<script setup lang="ts">
import type { CareerProgress, WeeklyActivity } from "@bao/shared/types/search";
import { useI18n } from "vue-i18n";
import {
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { formatDateWithLocale } from "~/utils/locale-format";

const props = defineProps<{
  weekly: WeeklyActivity | null;
  activeDays: WeeklyActivity["days"];
  career: CareerProgress | null;
}>();

const { t, locale, fallbackLocale } = useI18n();

function formatDayLabel(date: string): string {
  return (
    formatDateWithLocale(date, locale.value, fallbackLocale.value, {
      month: "short",
      day: "numeric",
    }) ?? date
  );
}

const hasWeeklyActivity = computed(() => props.activeDays.length > 0);
</script>

<template>
  <UiGlassCard aria-labelledby="gamification-activity-title">
    <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
        <h2 id="gamification-activity-title" class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
          {{ t("gamificationPage.activity.title") }}
        </h2>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("gamificationPage.activity.description") }}
        </p>
      </div>

      <SectionGrid grid-token="twoColumn">
        <UiGlassCard variant="subtle" :stagger-index="0">
          <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p4]">
            <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.activity.weeklyTitle") }}
            </h3>
            <template v-if="weekly && hasWeeklyActivity">
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("gamificationPage.activity.weeklyTotalXp", { xp: weekly.totalXP }) }}
              </p>
              <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <li
                  v-for="day in activeDays"
                  :key="day.date"
                  class="flex items-center justify-between"
                  :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
                >
                  <span>{{ formatDayLabel(day.date) }}</span>
                  <span class="text-secondary">
                    {{
                      t("gamificationPage.activity.daySummary", {
                        count: day.actions,
                        xp: day.xpEarned,
                      })
                    }}
                  </span>
                </li>
              </ul>
            </template>
            <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.activity.weeklyEmpty") }}
            </p>
          </div>
        </UiGlassCard>

        <UiGlassCard variant="subtle" :stagger-index="1">
          <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p4]">
            <h3 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.activity.careerTitle") }}
            </h3>
            <template v-if="career">
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{
                  t("gamificationPage.activity.skillCoverage", {
                    value: career.skillCoverage,
                  })
                }}
              </p>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{
                  t("gamificationPage.activity.applicationSuccessRate", {
                    value: career.applicationSuccessRate,
                  })
                }}
              </p>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{
                  t("gamificationPage.activity.interviewSessions", {
                    count: career.interviewTrend.length,
                  })
                }}
              </p>
            </template>
            <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("gamificationPage.activity.careerEmpty") }}
            </p>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
