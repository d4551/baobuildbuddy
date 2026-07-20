<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { RecentInterviewSession } from "~/types/interview";

defineProps<{
  recentSessions: readonly RecentInterviewSession[];
  currentPage: number;
  totalPages: number;
  pageNumbers: readonly number[];
  summary: string;
  pageAria: (page: number) => string;
  formatSessionDate: (value: string | undefined) => string;
  modeLabel: (mode: "job" | "studio" | undefined) => string;
  getScoreBadgeClass: (score: number | null | undefined) => string;
  viewAllTo: string;
}>();

const emit = defineEmits<{
  viewSession: [id: string];
  updatePage: [page: number];
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mb4]">
        <h2 class="card-title">{{ t("interviewHub.recent.title") }}</h2>
        <NuxtLink :to="viewAllTo" :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-ghost btn-sm']">
          {{ t("interviewHub.recent.viewAllButton") }}
        </NuxtLink>
      </div>

      <EmptyState
        v-if="recentSessions.length === 0"
        title-key="interviewHub.recent.title"
        description-key="interviewHub.recent.emptyState"
        cta-label-key="interviewHistory.emptyStateCta"
        cta-aria-key="interviewHistory.emptyStateCtaAria"
        :cta-to="APP_ROUTES.interview"
      />

      <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <ResponsiveDataSurface>
          <template #cards>
            <ul
              class="list-none"
              :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
              :aria-label="t('interviewHub.recent.tableAria')"
            >
              <li
                v-for="session in recentSessions"
                :key="session.id"
                class="rounded-box border border-base-300 bg-base-100"
                :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
              >
                <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <div>
                    <p class="font-semibold">{{ session.studioName || session.studioId }}</p>
                    <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                      {{ session.role || session.config.roleType }}
                    </p>
                    <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                      {{ formatSessionDate(session.createdAt) }}
                    </p>
                  </div>
                  <div class="flex flex-col items-end" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
                    <span
                      class="badge badge-sm"
                      :class="session.config.interviewMode === 'job' ? 'badge-primary' : 'badge-ghost'"
                    >
                      {{ modeLabel(session.config.interviewMode) }}
                    </span>
                    <span class="badge badge-sm" :class="getScoreBadgeClass(session.score)">
                      {{ session.score ?? 0 }}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  :class="[TOUCH_TARGET_MIN_CLASS, FLUID_WIDTH_CLASS, 'btn btn-ghost btn-sm']"
                  :aria-label="t('interviewHub.recent.viewSessionAria', { id: session.id })"
                  @click.stop="emit('viewSession', session.id)"
                >
                  {{ t("interviewHub.recent.viewButton") }}
                </button>
              </li>
            </ul>
          </template>
          <template #table>
            <table class="table table-zebra table-sm" :aria-label="t('interviewHub.recent.tableAria')">
              <thead>
                <tr>
                  <th scope="col">{{ t("interviewHub.recent.columns.context") }}</th>
                  <th scope="col">{{ t("interviewHub.recent.columns.role") }}</th>
                  <th scope="col">{{ t("interviewHub.recent.columns.mode") }}</th>
                  <th scope="col">{{ t("interviewHub.recent.columns.score") }}</th>
                  <th scope="col">{{ t("interviewHub.recent.columns.date") }}</th>
                  <th scope="col">
                    <span class="sr-only">{{ t("interviewHub.recent.viewButton") }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="session in recentSessions" :key="session.id" class="hover:bg-base-200">
                  <td>{{ session.studioName || session.studioId }}</td>
                  <td>{{ session.role || session.config.roleType }}</td>
                  <td>
                    <span
                      class="badge badge-sm"
                      :class="session.config.interviewMode === 'job' ? 'badge-primary' : 'badge-ghost'"
                    >
                      {{ modeLabel(session.config.interviewMode) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="getScoreBadgeClass(session.score)">
                      {{ session.score ?? 0 }}%
                    </span>
                  </td>
                  <td>{{ formatSessionDate(session.createdAt) }}</td>
                  <td>
                    <button
                      type="button"
                      :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-ghost btn-sm']"
                      :aria-label="t('interviewHub.recent.viewSessionAria', { id: session.id })"
                      @click.stop="emit('viewSession', session.id)"
                    >
                      {{ t("interviewHub.recent.viewButton") }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </ResponsiveDataSurface>

        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :page-numbers="pageNumbers"
          :summary="summary"
          :navigation-aria="t('interviewHub.recent.pagination.navigationAria')"
          :previous-aria="t('interviewHub.recent.pagination.previousAria')"
          :next-aria="t('interviewHub.recent.pagination.nextAria')"
          :page-aria="pageAria"
          @update:current-page="emit('updatePage', $event)"
        />
      </div>
    </div>
  </div>
</template>
