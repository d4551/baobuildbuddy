<script setup lang="ts">
/**
 * Canonical job summary card. Single source for every surface that renders a job
 * as a card: the job board list, the "Recommended for you" rail, and any future
 * job rail.
 *
 * This exists because the two surfaces on `/jobs` had each grown their own
 * markup. The list card carried location, remote/experience badges, the match
 * score, a description clamp, the posted date, and Interview/View actions; the
 * recommendation card carried a title and a company name and nothing else. So a
 * recommended job — the one the product actively pushes at the user — was the
 * least actionable card on the page, and no gate could notice because the
 * divergence lived in two hand-written template blocks.
 *
 * `density` selects how much of the same card is shown, so the two surfaces stay
 * one implementation rather than two that drift again.
 */
import type { Job, JobExperienceLevel } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import UiGlassCard from "~/components/ui/UiGlassCard.vue";
import {
  BADGE_OUTLINE_SM_CLASS,
  BADGE_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
  BODY_TEXT_SM_CLASS,
  BODY_TEXT_XS_CLASS,
  CARD_TITLE_LG_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CHEVRON_CLASS,
  OUTLINE_ACTION_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  ROW_GAP_XS_CLASS,
  STACK_SPACING_SM_CLASS,
} from "~/constants/layout";

/** How much of the card body is rendered. */
type JobCardDensity = "full" | "compact";

const props = withDefaults(
  defineProps<{
    job: Job;
    /** `full` renders description, date, and actions; `compact` stops after badges. */
    density?: JobCardDensity;
    /** Route for the card's link overlay (clickable card). */
    to?: string;
    /** Aria label for the card's link overlay. */
    linkAriaLabel?: string;
    /** Stagger index for the card's entrance animation (0-based, capped). */
    staggerIndex?: number;
    /** Resolves an experience level to its localized label. */
    experienceLabel: (value: JobExperienceLevel) => string;
    /** Formats the posted date for display. */
    formatDate: (value: string) => string;
  }>(),
  {
    density: "full",
    to: "",
    linkAriaLabel: "",
    staggerIndex: undefined,
  },
);

const emit = defineEmits<{
  interview: [jobId: string];
  view: [jobId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card-body relative z-10">
    <div :class="['flex items-start justify-between', ROW_GAP_XS_CLASS]">
      <h3 :class="CARD_TITLE_LG_CLASS">{{ props.job.title }}</h3>
      <JobMatchScore v-if="typeof props.job.matchScore === 'number'" :score="props.job.matchScore" compact />
    </div>

    <p class="font-medium text-secondary">{{ props.job.company }}</p>

    <div :class="[STACK_SPACING_SM_CLASS, 'flex flex-wrap', ROW_GAP_XS_CLASS]">
      <span :class="BADGE_SM_CLASS">
        <svg :class="['me-1', ICON_SIZE_CHEVRON_CLASS]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ props.job.location }}
      </span>

      <span v-if="props.job.remote" :class="BADGE_SUCCESS_SM_CLASS">
        {{ t("common.workMode.remote") }}
      </span>

      <span v-if="props.job.experienceLevel" :class="BADGE_OUTLINE_SM_CLASS">
        {{ props.experienceLabel(props.job.experienceLevel) }}
      </span>
    </div>

    <template v-if="props.density === 'full'">
      <p :class="['line-clamp-2', STACK_SPACING_SM_CLASS, BODY_TEXT_SM_CLASS]">
        {{ props.job.description }}
      </p>

      <div
        :class="[
          'card-actions',
          STACK_SPACING_SM_CLASS,
          'items-center justify-between',
          POINTER_EVENTS_TOKEN_CLASS.auto,
        ]"
      >
        <span :class="BODY_TEXT_XS_CLASS">
          {{ props.formatDate(props.job.postedDate) }}
        </span>
        <div :class="['flex', ROW_GAP_XS_CLASS]">
          <button
            type="button"
            :class="[OUTLINE_ACTION_CLASS]"
            :aria-label="t('jobsPage.interviewAria', { title: props.job.title, company: props.job.company })"
            @click.stop="emit('interview', props.job.id)"
          >
            {{ t("jobsPage.interviewButton") }}
          </button>
          <button
            type="button"
            :class="[PRIMARY_ACTION_CLASS]"
            :aria-label="t('jobsPage.viewAria', { title: props.job.title, company: props.job.company })"
            @click.stop="emit('view', props.job.id)"
          >
            {{ t("jobsPage.viewButton") }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
