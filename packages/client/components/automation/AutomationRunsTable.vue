<script setup lang="ts">
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_INFO_OUTLINE_CLASS,
} from "~/constants/layout-badges";

defineProps<{
  runs: ReadonlyArray<RpaRunExecutionEnvelope>;
  isLoading: boolean;
  isLiveRun: (run: RpaRunExecutionEnvelope) => boolean;
  formatRunType: (runType: RpaRunExecutionEnvelope["type"]) => string;
  formatRunStatus: (runStatus: RpaRunExecutionEnvelope["status"]) => string;
  formatRunProgress: (run: RpaRunExecutionEnvelope) => string;
  formatDate: (value: string) => string;
  resolveRowClass: (run: RpaRunExecutionEnvelope) => Record<string, boolean>;
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <EmptyState
        v-if="!isLoading && runs.length === 0"
        title-key="automation.runs.emptyStateTitle"
        description-key="automation.runs.emptyStateDescription"
        cta-label-key="automation.runs.emptyStateCta"
        cta-aria-key="automation.runs.emptyStateCtaAria"
        :cta-to="APP_ROUTES.automation"
      />

      <ResponsiveDataSurface v-else>
        <template #cards>
          <ul
            class="list-none"
            :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]"
            :aria-label="t('automation.runs.tableAriaLabel')"
          >
            <li
              v-for="run in runs"
              :key="run.id"
              class="rounded-box border border-base-300 bg-base-100"
              :class="[resolveRowClass(run), STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
            >
              <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                <div :class="[TRUNCATE_FLEX_CHILD_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                  <p class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                    {{ formatRunType(run.type) }}
                  </p>
                  <p
                    class="truncate font-mono text-muted"
                    :class="[TYPOGRAPHY_SCALE_CLASS.xs]"
                    :title="run.id"
                  >
                    {{ run.id }}
                  </p>
                </div>
                <div class="flex shrink-0 items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <span :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ formatRunStatus(run.status) }}</span>
                  <span
                    v-if="isLiveRun(run)"
                    :class="[BADGE_INFO_OUTLINE_CLASS]"
                    :aria-label="t('automation.runs.liveBadgeAria')"
                  >
                    {{ t("automation.runs.liveBadge") }}
                  </span>
                </div>
              </div>
              <dl :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, TYPOGRAPHY_SCALE_CLASS.xs]">
                <div class="flex items-baseline justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <dt class="text-muted">{{ t("automation.runs.columns.progress") }}</dt>
                  <dd class="font-medium">{{ formatRunProgress(run) }}</dd>
                </div>
                <div class="flex items-baseline justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <dt class="shrink-0 text-muted">{{ t("automation.runs.columns.job") }}</dt>
                  <dd class="truncate font-medium">
                    {{ run.jobId || t("automation.runs.emptyJobId") }}
                  </dd>
                </div>
                <div class="flex items-baseline justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <dt class="text-muted">{{ t("automation.runs.columns.updated") }}</dt>
                  <dd class="font-medium">{{ formatDate(run.updatedAt) }}</dd>
                </div>
              </dl>
              <NuxtLink
                :to="APP_ROUTE_BUILDERS.automationRunDetail(run.id)"
                :class="[PRIMARY_ACTION_CLASS, FLUID_WIDTH_CLASS]"
                :aria-label="t('automation.runs.openRunDetailAria', { id: run.id })"
              >
                {{ t("automation.runs.openButton") }}
              </NuxtLink>
            </li>
          </ul>
        </template>

        <template #table>
          <table class="table table-zebra" :aria-label="t('automation.runs.tableAriaLabel')">
            <thead>
              <tr>
                <th scope="col">{{ t("automation.runs.columns.id") }}</th>
                <th scope="col">{{ t("automation.runs.columns.type") }}</th>
                <th scope="col">{{ t("automation.runs.columns.status") }}</th>
                <th scope="col" class="text-end">{{ t("automation.runs.columns.progress") }}</th>
                <th scope="col">{{ t("automation.runs.columns.job") }}</th>
                <th scope="col">{{ t("automation.runs.columns.updated") }}</th>
                <th scope="col">{{ t("automation.runs.columns.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="run in runs" :key="run.id" :class="resolveRowClass(run)">
                <th class="font-mono" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ run.id }}</th>
                <td>{{ formatRunType(run.type) }}</td>
                <td>
                  <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                    <span>{{ formatRunStatus(run.status) }}</span>
                    <span
                      v-if="isLiveRun(run)"
                      :class="[BADGE_INFO_OUTLINE_CLASS]"
                      :aria-label="t('automation.runs.liveBadgeAria')"
                    >
                      {{ t("automation.runs.liveBadge") }}
                    </span>
                  </div>
                </td>
                <td class="text-end">{{ formatRunProgress(run) }}</td>
                <td>{{ run.jobId || t("automation.runs.emptyJobId") }}</td>
                <td>{{ formatDate(run.updatedAt) }}</td>
                <td>
                  <NuxtLink
                    :to="APP_ROUTE_BUILDERS.automationRunDetail(run.id)"
                    :class="[GHOST_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
                    :aria-label="t('automation.runs.openRunDetailAria', { id: run.id })"
                  >
                    {{ t("automation.runs.openButton") }}
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </ResponsiveDataSurface>
    </div>
  </UiGlassCard>
</template>
