<script setup lang="ts">
import {
  LOADING_SKELETON_LINES,
} from "~/constants/numeric-ui";
import type { Job } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  INSET_PANEL_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_SOFT_PRIMARY_CLASS,
  BADGE_SOFT_WARNING_SM_CLASS,
} from "~/constants/layout-badges";

defineProps<{
  jobsLoading: boolean;
  topJobs: readonly Job[];
  jobsRoute: string;
  hasJobEnrichment: (job: Job) => boolean;
  jobInterviewFocusAreas: (job: Job) => readonly string[];
  relativePostedDate: (value: string) => string;
}>();

const emit = defineEmits<{
  interview: [jobId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h2 class="card-title">{{ t("automation.scraper.table.title") }}</h2>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span :class="[BADGE_SOFT_PRIMARY_CLASS]">
            {{ t("automation.scraper.stats.interviewEntryTitle") }}:
            {{ t("automation.scraper.stats.interviewEntryValue") }}
          </span>
          <NuxtLink :to="jobsRoute" :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]">
            {{ t("automation.scraper.table.openBoardButton") }}
          </NuxtLink>
        </div>
      </div>

      <LoadingSkeleton v-if="jobsLoading && topJobs.length === 0" :lines="LOADING_SKELETON_LINES.short" />

      <div v-else-if="topJobs.length === 0" role="alert" class="alert alert-soft">
        <span>{{ t("automation.scraper.table.emptyState") }}</span>
      </div>

      <ResponsiveDataSurface v-else>
        <template #cards>
          <ul
            class="list-none rounded-box border border-base-300"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3, PADDING_TOKEN_CLASS.p2]"
            :aria-label="t('automation.scraper.table.aria')"
          >
            <li
              v-for="job in topJobs"
              :key="job.id"
              :class="[INSET_PANEL_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
            >
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1, TRUNCATE_FLEX_CHILD_CLASS]">
                <p class="font-medium">{{ job.title }}</p>
                <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ job.company }}</p>
                <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ job.location }} · {{ relativePostedDate(job.postedDate) }}
                </p>
              </div>
              <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <span v-if="job.remote" :class="[BADGE_GHOST_SM_CLASS]">
                  {{ t("jobCard.remoteBadge") }}
                </span>
                <span v-if="job.hybrid" :class="[BADGE_GHOST_SM_CLASS]">
                  {{ t("jobCard.hybridBadge") }}
                </span>
              </div>
              <button
                type="button"
                :class="[PRIMARY_ACTION_CLASS, FLUID_WIDTH_CLASS]"
                :aria-label="t('automation.scraper.table.interviewAria', { title: job.title, company: job.company })"
                @click="emit('interview', job.id)"
              >
                {{ t("automation.scraper.table.interviewButton") }}
              </button>
            </li>
          </ul>
        </template>

        <template #table>
          <div class="overflow-x-auto rounded-box border border-base-300">
            <table class="table table-zebra" :aria-label="t('automation.scraper.table.aria')">
              <thead>
                <tr>
                  <th scope="col">{{ t("automation.scraper.table.columns.role") }}</th>
                  <th scope="col">{{ t("automation.scraper.table.columns.company") }}</th>
                  <th scope="col">{{ t("automation.scraper.table.columns.location") }}</th>
                  <th scope="col">{{ t("automation.scraper.table.columns.posted") }}</th>
                  <th scope="col">
                    <span class="sr-only">{{ t("automation.scraper.table.actionsLabel") }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in topJobs" :key="job.id" class="hover:bg-base-200">
                  <td>
                    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                      <div class="font-medium">{{ job.title }}</div>
                      <p
                        v-if="hasJobEnrichment(job)"
                        class="text-secondary"
                        :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
                      >
                        <span class="font-medium">{{ t("automation.scraper.table.personaSummaryLabel") }}</span>
                        {{ job.enrichment?.summary }}
                      </p>
                      <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                        <span v-if="job.remote" :class="[BADGE_GHOST_SM_CLASS]">
                          {{ t("jobCard.remoteBadge") }}
                        </span>
                        <span v-if="job.hybrid" :class="[BADGE_GHOST_SM_CLASS]">
                          {{ t("jobCard.hybridBadge") }}
                        </span>
                        <span
                          v-for="focusArea in jobInterviewFocusAreas(job)"
                          :key="`${job.id}-${focusArea}`"
                          :class="[BADGE_SOFT_WARNING_SM_CLASS]"
                        >
                          {{ focusArea }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                      <div class="font-medium">{{ job.company }}</div>
                      <div v-if="job.source" class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                        {{ job.source }}
                      </div>
                    </div>
                  </td>
                  <td>{{ job.location }}</td>
                  <td>{{ relativePostedDate(job.postedDate) }}</td>
                  <td class="text-end">
                    <button
                      type="button"
                      :class="[PRIMARY_ACTION_CLASS]"
                      :aria-label="t('automation.scraper.table.interviewAria', { title: job.title, company: job.company })"
                      @click="emit('interview', job.id)"
                    >
                      {{ t("automation.scraper.table.interviewButton") }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </ResponsiveDataSurface>
    </div>
  </UiGlassCard>
</template>
