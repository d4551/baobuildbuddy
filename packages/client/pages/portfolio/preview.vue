<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
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
          <IconArrowLeft class="h-4 w-4" />
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

    <div v-else class="mx-auto max-w-6xl space-y-8">
      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body items-center gap-6 py-12 text-center">
          <div class="space-y-4">
            <h2 class="text-4xl font-bold sm:text-5xl">
              {{ portfolio.metadata?.title || t("portfolioPage.preview.defaultTitle") }}
            </h2>
            <p class="mx-auto max-w-2xl text-base-content/70">{{ portfolio.metadata?.bio }}</p>
          </div>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-if="portfolio.metadata?.email"
              :href="`mailto:${portfolio.metadata?.email}`"
              class="btn btn-outline"
              :aria-label="t('portfolioPage.preview.contactAria')"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
              <IconGlobe class="h-5 w-5" />
              {{ t("portfolioPage.preview.websiteButton") }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="featuredProjects.length" class="space-y-6">
        <PageHeaderBlock
          title-id="portfolio-featured-projects-title"
          :title="t('portfolioPage.preview.featuredProjectsTitle')"
        />
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            v-for="project in featuredProjects"
            :key="project.id"
            class="card card-border bg-base-100 shadow-sm"
          >
            <figure v-if="project.image" class="h-64">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="h-full w-full object-cover"
                sizes="sm:100vw md:50vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title">{{ project.title }}</h3>
              <p>{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="badge badge-primary"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions mt-4">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.projects.openProjectButton") }}
                  <IconExternalLink class="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="regularProjects.length" class="space-y-6">
        <PageHeaderBlock
          title-id="portfolio-all-projects-title"
          :title="featuredProjects.length ? t('portfolioPage.preview.moreProjectsTitle') : t('portfolioPage.projects.title')"
        />
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div
            v-for="project in regularProjects"
            :key="project.id"
            class="card card-border bg-base-100 shadow-sm"
          >
            <figure v-if="project.image" class="h-48">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="h-full w-full object-cover"
                sizes="sm:100vw md:33vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title text-base">{{ project.title }}</h3>
              <p class="text-sm">{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="badge badge-sm"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions mt-4">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.preview.viewButton") }}
                  <IconExternalLink class="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
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
