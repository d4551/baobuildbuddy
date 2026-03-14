<script setup lang="ts">
import {
  APP_ROUTE_BUILDERS,
  formatRelativeTimeForDate,
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote?: boolean;
    hybrid?: boolean;
    postedDate: string;
    technologies: string[];
    matchScore?: number;
  };
}>();

const emit = defineEmits<{
  save: [];
  unsave: [];
}>();

const { t } = useI18n();
const isSaved = ref(false);

const visibleTechs = computed(() => props.job.technologies.slice(0, 5));
const remainingCount = computed(() => Math.max(0, props.job.technologies.length - 5));

const matchScoreColor = computed(() => {
  if (!props.job.matchScore) return "badge-ghost";
  if (props.job.matchScore >= SCORE_PASS_THRESHOLD) return "badge-success";
  if (props.job.matchScore >= SCORE_WARNING_THRESHOLD) return "badge-warning";
  return "badge-error";
});

const relativeTime = computed(() =>
  formatRelativeTimeForDate(props.job.postedDate, (key, params) => t(key, params), {
    keyPrefix: "jobCard.relativeTime",
  }),
);

function toggleSave() {
  isSaved.value = !isSaved.value;
  emit(isSaved.value ? "save" : "unsave");
}

async function navigateToJob() {
  await navigateTo(APP_ROUTE_BUILDERS.jobDetail(props.job.id));
}
</script>

<template>
  <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
    <div
      class="card-body"
      role="button"
      tabindex="0"
      :aria-label="t('jobCard.viewAria', { title: job.title, company: job.company })"
      @click="navigateToJob"
      @keydown.enter="navigateToJob"
      @keydown.space.prevent="navigateToJob"
    >
      <div class="flex justify-between items-start">
        <h2 class="card-title text-lg">{{ job.title }}</h2>
        <button
          class="btn btn-ghost btn-sm btn-circle"
          :aria-label="isSaved ? t('jobCard.unsaveAria') : t('jobCard.saveAria')"
          :aria-pressed="isSaved"
          @click.stop="toggleSave"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            :fill="isSaved ? 'currentColor' : 'none'"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-base-content/70 font-medium">{{ job.company }}</p>

        <div class="flex flex-wrap gap-2 items-center">
          <div class="badge badge-ghost">{{ job.location }}</div>
          <div v-if="job.remote" class="badge badge-primary">{{ t("jobCard.remoteBadge") }}</div>
          <div v-if="job.hybrid" class="badge badge-secondary">{{ t("jobCard.hybridBadge") }}</div>
          <div
            v-if="job.matchScore"
            class="badge"
            :class="matchScoreColor"
            :aria-label="t('jobCard.matchBadgeAria', { score: job.matchScore })"
          >
            {{ t("jobCard.matchBadge", { score: job.matchScore }) }}
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="tech in visibleTechs"
            :key="tech"
            class="badge badge-outline badge-sm"
          >
            {{ tech }}
          </div>
          <div v-if="remainingCount > 0" class="badge badge-outline badge-sm">
            {{ t("jobCard.moreTechnologies", { count: remainingCount }) }}
          </div>
        </div>

        <div class="text-xs text-base-content/50 mt-2">
          {{ relativeTime }}
        </div>
      </div>
    </div>
  </div>
</template>
