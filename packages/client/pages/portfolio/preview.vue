<script setup lang="ts">
defineOptions({ name: "PagesPortfolioPreviewPage" });

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  CONTENT_H_48_CLASS,
  CONTENT_H_64_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_PRINT_HIDDEN_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  PROSE_MEASURE_CENTER_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_PRIMARY_CLASS,
  BADGE_SM_CLASS,
} from "~/constants/layout-badges";
import { HERO_TITLE_RESPONSIVE_CLASS, UI_SPACING_CLASS_BY_TOKEN } from "~/constants/ui-layout";
import { getErrorMessage } from "~/utils/errors";

const router = useRouter();
const { portfolio, projects, loading, fetchPortfolio, exportPortfolio } = usePortfolio();
const { t } = useI18n();

useSeoMeta({
  title: t("portfolioPage.preview.pageTitle"),
  description: t("portfolioPage.preview.description"),
});

const pageError = ref<string | null>(null);
const featuredProjects = computed(() => projects.value.filter((project) => project.featured));
const regularProjects = computed(() => projects.value.filter((project) => !project.featured));

const { pending: bootstrapPending, refresh: refreshPortfolioPreview } = await useAsyncData(
  "portfolio-preview-bootstrap",
  async () => {
    pageError.value = null;
    const portfolioResult = await settlePromise(
      fetchPortfolio(),
      t("portfolioPage.preview.loadError"),
    );
    if (!portfolioResult.ok) {
      pageError.value = getErrorMessage(
        portfolioResult.error,
        t("portfolioPage.preview.loadError"),
      );
    }
    return portfolio.value;
  },
);

async function handleExport(format: "pdf" | "docx") {
  await exportPortfolio(format);
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="portfolio-preview-title"
  >
    <PageHeroHeader
      title-id="portfolio-preview-title"
      :title="t('portfolioPage.preview.pageTitle')"
      :description="t('portfolioPage.preview.description')"
    >
      <template #actions>
        <button type="button"
          :class="[GHOST_ACTION_PRINT_HIDDEN_CLASS]"
          :aria-label="t('portfolioPage.preview.backButtonAria')"
          @click="router.back()"
        >
          <IconArrowLeft :class="ICON_SIZE_CLASS['4']" />
          {{ t("portfolioPage.preview.backButton") }}
        </button>

        <AppExportMenu
          :button-label="t('portfolioPage.actions.exportButton')"
          :button-aria-label="t('portfolioPage.actions.exportAria')"
          :disabled="loading"
          :summary-class="`${PRIMARY_ACTION_CLASS} print:hidden`"
          @export="handleExport"
        />
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="bootstrapPending || loading" :lines="10" />

    <BootstrapErrorAlert
      v-else-if="pageError"
      :title="t('portfolioPage.preview.pageTitle')"
      :message="pageError"
      :retry-label="t('portfolioPage.preview.retryButton')"
      :retry-aria-label="t('portfolioPage.preview.retryAria')"
      @retry="() => refreshPortfolioPreview()"
    />

    <EmptyState
      v-else-if="!portfolio"
      title-key="portfolioPage.preview.notFoundTitle"
      description-key="portfolioPage.preview.notFoundDescription"
      cta-label-key="portfolioPage.preview.backButton"
      :cta-to="APP_ROUTES.portfolio"
    />

    <div v-else :class="UI_SPACING_CLASS_BY_TOKEN.relaxed">
      <UiGlassCard>
        <div class="card-body items-center text-center" :class="[FLEX_GAP_TOKEN_CLASS.gap6, PADDING_TOKEN_CLASS.py12]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
            <h2 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl4, HERO_TITLE_RESPONSIVE_CLASS]">
              {{ portfolio.metadata?.title || t("portfolioPage.preview.defaultTitle") }}
            </h2>
            <p :class="PROSE_MEASURE_CENTER_CLASS">{{ portfolio.metadata?.bio }}</p>
          </div>
          <div
            v-if="portfolio.metadata?.email || portfolio.metadata?.website"
            class="flex flex-wrap justify-center"
            :class="[FLEX_GAP_TOKEN_CLASS.gap4]"
          >
            <a
              v-if="portfolio.metadata?.email"
              :href="`mailto:${portfolio.metadata?.email}`"
              :class="[OUTLINE_ACTION_CLASS]"
              :aria-label="t('portfolioPage.preview.contactAria')"
            >
              <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ t("portfolioPage.preview.contactButton") }}
            </a>
            <a
              v-if="portfolio.metadata?.website"
              :href="portfolio.metadata?.website"
              target="_blank"
              rel="noopener noreferrer"
              :class="[OUTLINE_ACTION_CLASS]"
              :aria-label="t('portfolioPage.preview.websiteAria')"
            >
              <IconGlobe :class="ICON_SIZE_CLASS.sm" />
              {{ t("portfolioPage.preview.websiteButton") }}
            </a>
          </div>
        </div>
      </UiGlassCard>

      <div v-if="featuredProjects.length" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <PageHeaderBlock
          title-id="portfolio-featured-projects-title"
          :title="t('portfolioPage.preview.featuredProjectsTitle')"
        />
        <SectionGrid grid-token="twoColumnMdGap6">
          <UiGlassCard v-for="project in featuredProjects" :key="project.id">
            <figure v-if="project.image" :class="[CONTENT_H_64_CLASS, 'overflow-hidden']">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="object-cover" :class="[FLUID_WIDTH_CLASS, FLUID_HEIGHT_CLASS]"
                sizes="sm:100vw md:50vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title">{{ project.title }}</h3>
              <p>{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  :class="[BADGE_PRIMARY_CLASS]"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions" :class="[MARGIN_TOKEN_CLASS.mt4]">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[PRIMARY_ACTION_CLASS]"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.projects.openProjectButton") }}
                  <IconExternalLink :class="ICON_SIZE_CLASS['4']" />
                </a>
              </div>
            </div>
          </UiGlassCard>
        </SectionGrid>
      </div>

      <div v-if="regularProjects.length" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <PageHeaderBlock
          title-id="portfolio-all-projects-title"
          :title="featuredProjects.length > 0 ? t('portfolioPage.preview.moreProjectsTitle') : t('portfolioPage.projects.title')"
        />
        <SectionGrid grid-token="threeColumnMdGap6">
          <UiGlassCard v-for="project in regularProjects" :key="project.id">
            <figure v-if="project.image" :class="[CONTENT_H_48_CLASS, 'overflow-hidden']">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="object-cover" :class="[FLUID_WIDTH_CLASS, FLUID_HEIGHT_CLASS]"
                sizes="sm:100vw md:33vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title text-base">{{ project.title }}</h3>
              <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap1, MARGIN_TOKEN_CLASS.mt2]">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  :class="[BADGE_SM_CLASS]"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions" :class="[MARGIN_TOKEN_CLASS.mt4]">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  :class="[PRIMARY_ACTION_CLASS]"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.preview.viewButton") }}
                  <IconExternalLink :class="ICON_SIZE_CLASS.xs" />
                </a>
              </div>
            </div>
          </UiGlassCard>
        </SectionGrid>
      </div>

      <EmptyState
        v-if="projects.length === 0"
        title-key="portfolioPage.preview.emptyStateTitle"
        description-key="portfolioPage.preview.emptyStateDescription"
        cta-label-key="portfolioPage.preview.backButton"
        :cta-to="APP_ROUTES.portfolio"
      />
    </div>
  </PageScaffold>
</template>
