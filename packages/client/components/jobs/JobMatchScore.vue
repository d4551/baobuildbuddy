<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  score: number;
  breakdown?: {
    skills: number;
    experience: number;
    location: number;
  };
}>();
const { t } = useI18n();

const scoreColor = computed(() => {
  if (props.score > 80) return "text-success";
  if (props.score > 60) return "text-warning";
  return "text-error";
});

const scoreBorderColor = computed(() => {
  if (props.score > 80) return "border-success";
  if (props.score > 60) return "border-warning";
  return "border-error";
});
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div
      class="radial-progress"
      :class="[scoreColor, scoreBorderColor]"
      :style="`--value:${score};`"
      role="progressbar"
      :aria-label="t('jobsPage.matchBreakdown.overallProgressAria', { score })"
    >
      <span class="text-2xl font-bold">{{ score }}%</span>
    </div>

    <div v-if="breakdown" class="w-full space-y-3">
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>{{ t("jobsPage.matchBreakdown.skillsMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.skills }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.skills"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.skillsProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>{{ t("jobsPage.matchBreakdown.experienceMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.experience }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.experience"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.experienceProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>{{ t("jobsPage.matchBreakdown.locationMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.location }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.location"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.locationProgressAria')"
        ></progress>
      </div>
    </div>
  </div>
</template>
