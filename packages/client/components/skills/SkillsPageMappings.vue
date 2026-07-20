<script setup lang="ts">
import type { SkillMapping } from "@bao/shared/types/skill-mapping";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";
import {
  SKILLS_CATEGORY_LABEL_KEYS,
  SKILLS_CONFIDENCE_MAX,
  SKILLS_CONFIDENCE_MIN,
} from "~/constants/skills";

defineProps<{
  hasMappings: boolean;
  filteredMappings: SkillMapping[];
}>();

const emit = defineEmits<{
  delete: [id: string];
  add: [];
  clearFilters: [];
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
    cta-label-key="skillsPage.actions.addMappingButton"
    cta-aria-key="skillsPage.actions.addMappingAria"
    @cta="emit('add')"
  />

  <EmptyState
    v-else-if="filteredMappings.length === 0"
    title-key="skillsPage.filteredEmptyTitle"
    description-key="skillsPage.filteredEmptyDescription"
    cta-label-key="skillsPage.filters.clearButton"
    cta-aria-key="skillsPage.filters.clearAria"
    @cta="emit('clearFilters')"
  />

  <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
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
              <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
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
            <td :class="[WIDTH_TOKEN_CLASS.w40]">
              <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
                <div class="flex items-center justify-between font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  <span>{{ mapping.confidence }}%</span>
                  <span class="text-muted">
                    {{ resolveCategoryLabel(mapping.category) }}
                  </span>
                </div>
                <progress 
                  class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
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

    <div class="md:hidden" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
      <article 
        v-for="mapping in filteredMappings"
        :key="mapping.id"
        :class="SURFACE_GLASS_CARD_CLASS"
        :aria-label="t('skillsPage.mobile.cardAria', { skill: mapping.transferableSkill })"
      >
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
          <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div>
              <h2 class="card-title text-base">{{ mapping.transferableSkill }}</h2>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ mapping.gameExpression }}</p>
            </div>
            <span class="badge badge-primary badge-sm">{{ mapping.confidence }}%</span>
          </div>

          <progress 
            class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
            :value="normalizedConfidence(mapping.confidence)"
            :max="SKILLS_CONFIDENCE_MAX"
            :aria-label="t('skillsPage.table.confidenceAria', { confidence: mapping.confidence })"
          ></progress>

          <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap1]">
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
