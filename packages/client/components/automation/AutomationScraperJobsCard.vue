<script setup lang="ts">
import type { Job } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h2 class="card-title">{{ t("automation.scraper.table.title") }}</h2>
        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <span class="badge badge-soft badge-primary">
            {{ t("automation.scraper.stats.interviewEntryTitle") }}:
            {{ t("automation.scraper.stats.interviewEntryValue") }}
          </span>
          <NuxtLink :to="jobsRoute" class="btn btn-ghost btn-sm">
            {{ t("automation.scraper.table.openBoardButton") }}
          </NuxtLink>
        </div>
      </div>

      <LoadingSkeleton v-if="jobsLoading && topJobs.length === 0" :lines="4" />

      <div v-else-if="topJobs.length === 0" role="alert" class="alert alert-soft">
        <span>{{ t("automation.scraper.table.emptyState") }}</span>
      </div>

      <div v-else class="overflow-x-auto rounded-box border border-base-300">
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
                  <p v-if="hasJobEnrichment(job)" class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                    <span class="font-medium">{{ t("automation.scraper.table.personaSummaryLabel") }}</span>
                    {{ job.enrichment?.summary }}
                  </p>
                  <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                    <span v-if="job.remote" class="badge badge-ghost badge-sm">
                      {{ t("jobCard.remoteBadge") }}
                    </span>
                    <span v-if="job.hybrid" class="badge badge-ghost badge-sm">
                      {{ t("jobCard.hybridBadge") }}
                    </span>
                    <span 
                      v-for="focusArea in jobInterviewFocusAreas(job)"
                      :key="`${job.id}-${focusArea}`"
                      class="badge badge-warning badge-soft badge-sm"
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
              <td class="text-right">
                <button 
                  class="btn btn-primary btn-sm"
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
    </div>
  </div>
</template>
