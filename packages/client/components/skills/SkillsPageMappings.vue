<script setup lang="ts">
import {
  SKILLS_CATEGORY_LABEL_KEYS,
  SKILLS_CONFIDENCE_MAX,
  SKILLS_CONFIDENCE_MIN,
} from "~/constants/skills";
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";

defineProps<{
  hasMappings: boolean;
  filteredMappings: SkillMapping[];
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const { t } = useI18n();

function resolveCategoryLabel(category: SkillMapping["category"]): string {
  return t(SKILLS_CATEGORY_LABEL_KEYS[category]);
}

function normalizedConfidence(confidence: number): number {
  return Math.min(SKILLS_CONFIDENCE_MAX, Math.max(SKILLS_CONFIDENCE_MIN, confidence));
}
</script>

<template>
  <EmptyState
    v-if="!hasMappings"
    title-key="skillsPage.emptyStateTitle"
    description-key="skillsPage.emptyStateDescription"
  />

  <EmptyState
    v-else-if="filteredMappings.length === 0"
    title-key="skillsPage.filteredEmptyTitle"
    description-key="skillsPage.filteredEmptyDescription"
  />

  <div v-else class="space-y-4">
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra" :aria-label="t('skillsPage.table.ariaLabel')">
        <thead>
          <tr>
            <th scope="col">{{ t("skillsPage.table.columns.gamingExperience") }}</th>
            <th scope="col">{{ t("skillsPage.table.columns.transferableSkill") }}</th>
            <th scope="col">{{ t("skillsPage.table.columns.applications") }}</th>
            <th scope="col">{{ t("skillsPage.table.columns.confidence") }}</th>
            <th scope="col">{{ t("skillsPage.table.columns.category") }}</th>
            <th scope="col">{{ t("skillsPage.table.columns.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mapping in filteredMappings" :key="mapping.id">
            <td class="font-medium">{{ mapping.gameExpression }}</td>
            <td>{{ mapping.transferableSkill }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="application in mapping.industryApplications.slice(0, 3)"
                  :key="application"
                  class="badge badge-sm badge-soft"
                >
                  {{ application }}
                </span>
                <span v-if="mapping.industryApplications.length > 3" class="badge badge-sm badge-ghost">
                  {{ t("skillsPage.table.moreApplications", { count: mapping.industryApplications.length - 3 }) }}
                </span>
              </div>
            </td>
            <td class="w-40">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span>{{ mapping.confidence }}%</span>
                  <span class="text-base-content/60">
                    {{ resolveCategoryLabel(mapping.category) }}
                  </span>
                </div>
                <progress
                  class="progress progress-primary w-full"
                  :value="normalizedConfidence(mapping.confidence)"
                  :max="SKILLS_CONFIDENCE_MAX"
                  :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
                ></progress>
              </div>
            </td>
            <td>
              <span class="badge badge-outline badge-sm">
                {{ resolveCategoryLabel(mapping.category) }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-ghost btn-sm btn-error"
                :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
                @click="emit('delete', mapping.id)"
              >
                {{ t("skillsPage.table.deleteButton") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space-y-3 md:hidden">
      <article
        v-for="mapping in filteredMappings"
        :key="mapping.id"
        class="card card-border bg-base-100 shadow-sm"
        :aria-label="t('skillsPage.mobile.cardAria', { skill: mapping.transferableSkill })"
      >
        <div class="card-body gap-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="card-title text-base">{{ mapping.transferableSkill }}</h2>
              <p class="text-sm text-base-content/70">{{ mapping.gameExpression }}</p>
            </div>
            <span class="badge badge-primary badge-sm">{{ mapping.confidence }}%</span>
          </div>

          <progress
            class="progress progress-primary w-full"
            :value="normalizedConfidence(mapping.confidence)"
            :max="SKILLS_CONFIDENCE_MAX"
            :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
          ></progress>

          <div class="flex flex-wrap gap-1">
            <span class="badge badge-outline badge-sm">{{ resolveCategoryLabel(mapping.category) }}</span>
            <span
              v-for="application in mapping.industryApplications.slice(0, 3)"
              :key="application"
              class="badge badge-sm badge-soft"
            >
              {{ application }}
            </span>
          </div>

          <div class="card-actions justify-end">
            <button
              class="btn btn-ghost btn-sm btn-error"
              :aria-label="t('skillsPage.table.deleteAria', { skill: mapping.transferableSkill })"
              @click="emit('delete', mapping.id)"
            >
              {{ t("skillsPage.table.deleteButton") }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
