<script setup lang="ts">
import { PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT } from "@bao/shared/constants/portfolio";
import type { PortfolioProject } from "@bao/shared/types/portfolio";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import type { ProjectDirection } from "~/composables/usePortfolioPage";
import {
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  HEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  currentPage: number;
  paginatedProjects: readonly PortfolioProject[];
  pageNumbers: readonly number[];
  reorderingProjectId: string | null;
  summary: string;
  totalPages: number;
  projectPageAria: (page: number) => string;
  canMove: (projectId: string | undefined, direction: ProjectDirection) => boolean;
  filteredProjectsLength: number;
  allProjectsLength: number;
}>();

const emit = defineEmits<{
  openAdd: [];
  edit: [project: PortfolioProject];
  delete: [projectId: string | undefined];
  move: [projectId: string | undefined, direction: ProjectDirection];
  "update:currentPage": [page: number];
}>();

const { t } = useI18n();

const hasTechnologies = (project: PortfolioProject): boolean =>
  Array.isArray(project.technologies) && project.technologies.length > 0;
</script>

<template>
  <section :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]" aria-labelledby="portfolio-projects-title">
    <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
      <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl]" id="portfolio-projects-title">{{ t("portfolioPage.projects.title") }}</h2>
      <button class="btn btn-primary" :aria-label="t('portfolioPage.projects.addAria')" @click="emit('openAdd')">
        <IconPlus :class="[ICON_SIZE_CLASS[4]]"/>
        {{ t("portfolioPage.projects.addButton") }}
      </button>
    </div>

    <div v-if="props.allProjectsLength === 0" class="alert alert-soft" role="status">
      <IconInfoCircle :class="[ICON_SIZE_CLASS[6]]"/>
      <span>{{ t("portfolioPage.projects.emptyState") }}</span>
    </div>

    <FilteredEmptyAlert
      v-else-if="props.filteredProjectsLength === 0"
      message-key="portfolioPage.projects.filteredEmptyState"
    />

    <SectionGrid v-else grid-token="threeColumnResponsive">
      <div 
        v-for="(project, idx) in props.paginatedProjects"
        :key="project.id || `${project.title}-${idx}`"
        :class="SURFACE_GLASS_CARD_CLASS"
      >
        <figure class="overflow-hidden" :class="[HEIGHT_TOKEN_CLASS.h48]" v-if="project.image">
          <NuxtImg 
            :src="project.image"
            :alt="project.title"
            class="object-cover" :class="[FLUID_WIDTH_CLASS, FLUID_HEIGHT_CLASS]"
            sizes="sm:100vw md:50vw lg:33vw"
            format="webp"
          />
        </figure>

        <div class="card-body">
          <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <h3 class="card-title text-base">{{ project.title }}</h3>
            <svg class="shrink-0 text-muted" :class="[ICON_SIZE_CLASS[5]]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="SVG_STROKE_WIDTH_DEFAULT" d="M4 8h16M4 16h16" />
            </svg>
          </div>

          <p class="line-clamp-3 text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.description }}</p>

          <div class="flex flex-wrap" v-if="hasTechnologies(project)" :class="[MARGIN_TOKEN_CLASS.mt2, FLEX_GAP_TOKEN_CLASS.gap1]">
            <span 
              v-for="tech in project.technologies.slice(0, PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT)"
              :key="tech"
              class="badge badge-xs"
            >
              {{ tech }}
            </span>
            <span
              v-if="project.technologies.length > PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT"
              class="badge badge-xs"
            >
              +{{ project.technologies.length - PORTFOLIO_PROJECT_TECH_PREVIEW_LIMIT }}
            </span>
          </div>

          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
            <span v-if="project.featured" class="badge badge-primary badge-xs">
              {{ t("portfolioPage.projects.featuredBadge") }}
            </span>
            <a 
              v-if="project.liveUrl"
              :href="project.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]"
              :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
            >
              {{ t("portfolioPage.projects.openProjectButton") }}
            </a>
          </div>

          <div class="card-actions justify-between" :class="[MARGIN_TOKEN_CLASS.mt4]">
            <div class="join">
              <button 
                class="btn join-item btn-xs btn-ghost"
                :disabled="!props.canMove(project.id, 'up') || props.reorderingProjectId === project.id"
                :aria-label="t('portfolioPage.projects.moveUpAria', { title: project.title })"
                @click="emit('move', project.id, 'up')"
              >
                {{ t("portfolioPage.projects.moveUpButton") }}
              </button>
              <button 
                class="btn join-item btn-xs btn-ghost"
                :disabled="!props.canMove(project.id, 'down') || props.reorderingProjectId === project.id"
                :aria-label="t('portfolioPage.projects.moveDownAria', { title: project.title })"
                @click="emit('move', project.id, 'down')"
              >
                {{ t("portfolioPage.projects.moveDownButton") }}
              </button>
            </div>

            <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <button 
                class="btn btn-xs btn-outline"
                :aria-label="t('portfolioPage.projects.editAria', { title: project.title })"
                @click="emit('edit', project)"
              >
                {{ t("portfolioPage.projects.editButton") }}
              </button>
              <button 
                class="btn btn-xs btn-error btn-outline"
                :aria-label="t('portfolioPage.projects.deleteAria', { title: project.title })"
                @click="emit('delete', project.id)"
              >
                {{ t("portfolioPage.projects.deleteButton") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionGrid>

    <AppPagination
      :current-page="props.currentPage"
      :total-pages="props.totalPages"
      :page-numbers="props.pageNumbers"
      :summary="props.summary"
      :navigation-aria="t('portfolioPage.pagination.navigationAria')"
      :previous-aria="t('portfolioPage.pagination.previousAria')"
      :next-aria="t('portfolioPage.pagination.nextAria')"
      :page-aria="props.projectPageAria"
      @update:current-page="emit('update:currentPage', $event)"
    />
  </section>
</template>
