<script setup lang="ts">
import { useI18n } from "vue-i18n";

const router = useRouter();
const { portfolio, projects, loading, fetchPortfolio, exportPortfolio } = usePortfolio();
const { t } = useI18n();

onMounted(() => {
  fetchPortfolio();
});

async function handleExport() {
  await exportPortfolio();
}
</script>

<template>
  <div>
    <header class="mb-4">
      <h1 class="text-3xl font-bold">{{ t("portfolioPage.preview.pageTitle") }}</h1>
    </header>

    <div class="flex items-center justify-between mb-6 no-print">
      <button class="btn btn-ghost btn-sm" :aria-label="t('portfolioPage.preview.backButtonAria')" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {{ t("portfolioPage.preview.backButton") }}
      </button>

      <button class="btn btn-primary btn-sm" :aria-label="t('portfolioPage.preview.exportPdfAria')" @click="handleExport">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {{ t("portfolioPage.preview.exportPdfButton") }}
      </button>
    </div>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else-if="portfolio" class="max-w-6xl mx-auto">
      <!-- Hero Section -->
      <div class="card bg-gradient-to-br from-primary to-secondary text-primary-content mb-8">
        <div class="card-body text-center py-12">
          <h2 class="text-5xl font-bold mb-4">{{ portfolio.metadata?.title || t("portfolioPage.preview.defaultTitle") }}</h2>
          <p class="text-xl max-w-2xl mx-auto mb-6">{{ portfolio.metadata?.bio }}</p>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              v-if="portfolio.metadata?.email"
              :href="`mailto:${portfolio.metadata?.email}`"
              class="btn btn-outline"
              :aria-label="t('portfolioPage.preview.contactAria')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {{ t("portfolioPage.preview.websiteButton") }}
            </a>
          </div>
        </div>
      </div>

      <!-- Featured Projects -->
      <div v-if="projects.filter((p) => p.featured).length" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">{{ t("portfolioPage.preview.featuredProjectsTitle") }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="project in projects.filter((p) => p.featured)"
            :key="project.id"
            class="card bg-base-200"
          >
            <figure v-if="project.image" class="h-64">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="w-full h-full object-cover"
                sizes="sm:100vw md:50vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title">{{ project.title }}</h3>
              <p>{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="flex flex-wrap gap-2 mt-2">
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
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Projects -->
      <div v-if="projects.filter((p) => !p.featured).length" class="mb-12">
        <h2 class="text-3xl font-bold mb-6">
          {{
            projects.some((p) => p.featured)
              ? t("portfolioPage.preview.moreProjectsTitle")
              : t("portfolioPage.projects.title")
          }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="project in projects.filter((p) => !p.featured)"
            :key="project.id"
            class="card bg-base-200"
          >
            <figure v-if="project.image" class="h-48">
              <NuxtImg
                :src="project.image"
                :alt="project.title"
                class="w-full h-full object-cover"
                sizes="sm:100vw md:33vw"
                format="webp"
              />
            </figure>
            <div class="card-body">
              <h3 class="card-title text-base">{{ project.title }}</h3>
              <p class="text-sm">{{ project.description }}</p>
              <div v-if="project.technologies?.length" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="tech in project.technologies"
                  :key="tech"
                  class="badge badge-xs"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-if="project.liveUrl" class="card-actions mt-4">
                <a
                  :href="project.liveUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-xs"
                  :aria-label="t('portfolioPage.projects.openProjectAria', { title: project.title })"
                >
                  {{ t("portfolioPage.preview.viewButton") }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!projects.length" class="alert" role="alert" :aria-label="t('portfolioPage.preview.emptyState')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ t("portfolioPage.preview.emptyState") }}</span>
      </div>
    </div>

    <div v-else class="alert alert-error" role="alert" :aria-label="t('portfolioPage.preview.notFound')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ t("portfolioPage.preview.notFound") }}</span>
    </div>
  </div>
</template>

<style>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
