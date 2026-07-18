<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PROSE_MEASURE_CENTER_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { UI_SPACING_CLASS_BY_TOKEN } from "~/constants/ui-layout";
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
        <button
          class="btn btn-ghost print:hidden"
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
          summary-class="btn btn-primary print:hidden"
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
      <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body items-center text-center" :class="[FLEX_GAP_TOKEN_CLASS.gap6, PADDING_TOKEN_CLASS.py12]">
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
            <h2 :class="[TYPOGRAPHY_SCALE_CLASS.xl4, HERO_TITLE_RESPONSIVE_CLASS, 'font-bold']">
              {{ portfolio.metadata?.title || t("portfolioPage.preview.defaultTitle") }}
            </h2>
            <p :class="PROSE_MEASURE_CENTER_CLASS">{{ portfolio.metadata?.bio }}</p>
          </div>
          <div class="flex flex-wrap justify-center" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
            <a
              v-if="portfolio.metadata?.email"
              :href="`mailto:${portfolio.metadata?.email}`"
              class="btn btn-outline"
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
              class="btn btn-outline"
              :aria-label="t('portfolioPage.preview.websiteAria')"
            >
              <IconGlobe :class="ICON_SIZE_CLASS.sm" />
              {{ t("portfolioPage.preview.websiteButton") }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="featuredProjects.length" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <PageHeaderBlock
          title-id="portfolio-featured-projects-title"
          :title="t('portfolioPage.preview.featuredProjectsTitle')"
        />
        <SectionGrid grid-token="twoColumnMdGap6">
          <div
            v-for="project in featuredProjects"
            :key="project.id"
            class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]"
          >
            <figure v-if="project.image" :class="CONTENT_H_64_CLASS">
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
                  class="badge badge-primary"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions" :class="[MARGIN_TOKEN_CLASS.mt4]">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.projects.openProjectButton") }}
                  <IconExternalLink :class="ICON_SIZE_CLASS['4']" />
                </a>
              </div>
            </div>
          </div>
        </SectionGrid>
      </div>

      <div v-if="regularProjects.length" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <PageHeaderBlock
          title-id="portfolio-all-projects-title"
          :title="featuredProjects.length ? t('portfolioPage.preview.moreProjectsTitle') : t('portfolioPage.projects.title')"
        />
        <SectionGrid grid-token="threeColumnMdGap6">
          <div
            v-for="project in regularProjects"
            :key="project.id"
            class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]"
          >
            <figure v-if="project.image" :class="HEIGHT_48_CLASS">
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
                  class="badge badge-sm"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions" :class="[MARGIN_TOKEN_CLASS.mt4]">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.preview.viewButton") }}
                  <IconExternalLink :class="ICON_SIZE_CLASS.xs" />
                </a>
              </div>
            </div>
          </div>
        </SectionGrid>
      </div>

      <EmptyState
        v-if="!projects.length"
        title-key="portfolioPage.preview.emptyStateTitle"
        description-key="portfolioPage.preview.emptyStateDescription"
        cta-label-key="portfolioPage.preview.backButton"
        :cta-to="APP_ROUTES.portfolio"
      />
    </div>
  </PageScaffold>
</template>
