<script setup lang="ts">
defineOptions({ name: "PagesResumePreviewPage" });

import {
  GHOST_ACTION_PRINT_HIDDEN_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  OUTLINE_ACTION_PRINT_HIDDEN_CLASS,
  PRIMARY_ACTION_CLASS,
} from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "@bao/shared/constants/routes";
import type { ResumeData } from "@bao/shared/types/resume";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncData, useRoute, useRouter, useSeoMeta } from "#imports";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { getResume, exportResume, loading } = useResume();
const { t } = useI18n();

useSeoMeta({
  title: t("resumePreview.pageTitle"),
  description: t("resumePreview.description"),
});

const pageError = ref<string | null>(null);
const resumeId = computed(() => {
  const routeResumeId = route.query[APP_ROUTE_QUERY_KEYS.id];
  return typeof routeResumeId === "string" ? routeResumeId : "";
});

const resumePreviewKey = computed(
  () => `resume-preview:${resumeId.value.length > 0 ? resumeId.value : "missing"}`,
);

const {
  data: resume,
  pending: bootstrapPending,
  refresh: refreshResumePreview,
} = await useAsyncData<ResumeData | null>(
  resumePreviewKey,
  async () => {
    pageError.value = null;

    if (!resumeId.value) {
      return null;
    }

    const resumeResult = await settlePromise(
      getResume(resumeId.value),
      t("resumePreview.loadError"),
    );
    if (!resumeResult.ok) {
      pageError.value = getErrorMessage(resumeResult.error, t("resumePreview.loadError"));
      return null;
    }

    return resumeResult.value;
  },
  {
    watch: [resumeId],
  },
);

const displaySkills = computed(() => {
  if (!resume.value?.skills) return [];
  const { technical = [], soft = [], gaming = [] } = resume.value.skills;
  return [...technical, ...soft, ...gaming];
});

const hasGamingExperience = computed(() => {
  const gamingExperience = resume.value?.gamingExperience;
  return Boolean(
    gamingExperience?.gameEngines || gamingExperience?.genres || gamingExperience?.shippedTitles,
  );
});

async function handleExport(format: "pdf" | "docx") {
  if (!resumeId.value) {
    return;
  }

  await exportResume(resumeId.value, undefined, format);
}

function handlePrint() {
  window.print();
}
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="content"
    spacing-token="comfortable"
    labelled-by="resume-preview-title"
  >
    <PageHeroHeader
      title-id="resume-preview-title"
      :title="t('resumePreview.pageTitle')"
      :description="t('resumePreview.description')"
    >
      <template #actions>
        <button type="button"
          :class="[GHOST_ACTION_PRINT_HIDDEN_CLASS]"
          :aria-label="t('resumePage.backButtonAria')"
          @click="router.back()"
        >
          <IconArrowLeft :class="ICON_SIZE_CLASS['4']" />
          {{ t("resumePage.backButton") }}
        </button>

        <button type="button"
          :class="[OUTLINE_ACTION_PRINT_HIDDEN_CLASS]"
          :aria-label="t('resumePreview.printAria')"
          @click="handlePrint"
        >
          <svg :class="ICON_SIZE_CLASS['4']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {{ t("resumePreview.printButton") }}
        </button>

        <AppExportMenu
          :button-label="t('resumePage.exportButton')"
          :button-aria-label="t('resumePage.exportButtonAria')"
          :disabled="loading"
          :summary-class="`${PRIMARY_ACTION_CLASS} print:hidden`"
          @export="handleExport"
        />
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="bootstrapPending || loading" :lines="10" />

    <BootstrapErrorAlert
      v-else-if="pageError"
      :title="t('resumePreview.pageTitle')"
      :message="pageError"
      :retry-label="t('resumePreview.retryButton')"
      :retry-aria-label="t('resumePreview.retryAria')"
      @retry="() => refreshResumePreview()"
    />

    <EmptyState
      v-else-if="!resume"
      title-key="resumePreview.notFoundTitle"
      description-key="resumePreview.notFoundDescription"
      cta-label-key="resumePage.backButton"
      :cta-to="APP_ROUTES.resume"
    />

    <ResumePreviewDocument
      v-else
      :resume="resume"
      :display-skills="displaySkills"
      :has-gaming-experience="hasGamingExperience"
    />
  </PageScaffold>
</template>
