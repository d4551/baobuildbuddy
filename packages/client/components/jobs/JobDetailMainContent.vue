<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  BADGE_OUTLINE_CLASS,
  BADGE_PRIMARY_CLASS,
  BADGE_PRIMARY_LG_CLASS,
  BADGE_SUCCESS_CLASS,
  BTN_VARIANT_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  SVG_STROKE_WIDTH_DEFAULT,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  job: {
    title: string;
    company?: string;
    description: string;
    location: string;
    remote?: boolean;
    experienceLevel?: string;
    salary?: string;
    matchScore?: number;
    requirements?: string[];
    technologies?: string[];
  };
  isSaved: boolean;
  titleId: string;
  heroDescription: string;
  jobExperienceLabel: (experienceLevel: string) => string;
}>();

const emit = defineEmits<{
  save: [];
  apply: [];
  interview: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="lg:col-span-2" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <div :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <PageHeroHeader
          :title-id="titleId"
          :title="job.title"
          :description="heroDescription"
          density="comfortable"
        >
          <template #actions>
            <button type="button"
              :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
              :aria-label="t('jobDetail.interviewAria')"
              @click="emit('interview')"
            >
              <svg :class="[ICON_SIZE_CLASS[5]]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t("jobDetail.interviewButton") }}
            </button>

            <button type="button"
              :class="[PRIMARY_ACTION_CLASS]"
              :aria-label="t('jobDetail.applyAria')"
              @click="emit('apply')"
            >
              <IconDocumentText :class="[ICON_SIZE_CLASS[5]]"/>
              {{ t("jobDetail.applyButton") }}
            </button>

            <button type="button"
              :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, { [BTN_VARIANT_CLASS.success]: isSaved }]"
              :aria-label="isSaved ? t('jobDetail.unsaveAria') : t('jobDetail.saveAria')"
              @click="emit('save')"
            >
              <svg :class="[ICON_SIZE_CLASS[5]]" :fill="isSaved ? 'currentColor' : 'none'" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {{ isSaved ? t("jobDetail.savedButton") : t("jobDetail.saveButton") }}
            </button>
          </template>

          <template v-if="typeof job.matchScore === 'number'" #aside>
            <div class="flex items-center justify-start lg:justify-end">
              <div class="rounded-box bg-base-100" :class="[PADDING_TOKEN_CLASS.p4]">
                <JobMatchScore :score="job.matchScore" />
                <p class="text-center text-muted" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("jobDetail.matchScoreLabel") }}</p>
              </div>
            </div>
          </template>
        </PageHeroHeader>

        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt4]">
          <span class="badge">
            <svg :class="[ICON_SIZE_CLASS[3], MARGIN_TOKEN_CLASS.mr1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ job.location }}
          </span>

          <span v-if="job.remote" :class="BADGE_SUCCESS_CLASS">{{ t("jobDetail.remoteBadge") }}</span>
          <span v-if="job.experienceLevel" :class="BADGE_OUTLINE_CLASS">{{ jobExperienceLabel(job.experienceLevel) }}</span>
          <span v-if="job.salary" :class="BADGE_PRIMARY_CLASS">{{ job.salary }}</span>
        </div>
      </div>
    </div>

    <div :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <h2 class="card-title">{{ t("jobDetail.descriptionTitle") }}</h2>
        <div class="prose max-w-none">
          <p class="whitespace-pre-wrap">{{ job.description }}</p>
        </div>
      </div>
    </div>

    <div v-if="job.requirements?.length" class="divider divider-primary">{{ t("jobDetail.requirementsTitle") }}</div>
    <div v-if="job.requirements?.length" :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <h2 class="card-title">{{ t("jobDetail.requirementsTitle") }}</h2>
        <ul class="list">
          <li class="list-row" :class="[PADDING_TOKEN_CLASS.px0, PADDING_TOKEN_CLASS.py2]" v-for="(requirement, index) in job.requirements" :key="index">
            {{ requirement }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="job.technologies?.length" class="divider divider-primary">{{ t("jobDetail.technologiesTitle") }}</div>
    <div v-if="job.technologies?.length" :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body">
        <h2 class="card-title">{{ t("jobDetail.technologiesTitle") }}</h2>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span v-for="tech in job.technologies" :key="tech" :class="BADGE_PRIMARY_LG_CLASS">
            {{ tech }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
