import {
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_CONTENT_PREVIEW_LENGTH,
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
  COVER_LETTER_LIST_PAGE_SIZE,
  COVER_LETTER_POSITION_MIN_LENGTH,
  COVER_LETTER_TEMPLATE_OPTIONS,
  isCoverLetterTemplate,
  type CoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNuxtApp, useRoute, useRouter, useServerSeoMeta } from "#imports";
import { coverLetterContentToPlainText } from "~/utils/cover-letter-content";
import { formatDateWithLocale } from "~/utils/locale-format";
import {
  type CoverLetterGenerateForm,
  createCoverLetterActions,
  useCoverLetterPageBootstrap,
} from "./cover-letter-list-page-actions";

type CoverLetterSortOrder = "newest" | "oldest";

type CoverLetterPageServices = ReturnType<typeof createCoverLetterPageServices>;
type CoverLetterPageState = ReturnType<typeof createCoverLetterPageState>;
type CoverLetterFilterState = ReturnType<typeof createCoverLetterFilterState>;

const COVER_LETTER_GENERATE_DIALOG_TITLE_ID = "cover-letter-page-generate-dialog-title";

function createCoverLetterPageServices() {
  const coverLetterState = useCoverLetter();
  const resumeState = useResume();
  const router = useRouter();
  const route = useRoute();
  const nuxtApp = useNuxtApp();
  const i18n = useI18n();

  return {
    ...coverLetterState,
    ...resumeState,
    router,
    route,
    $toast: nuxtApp.$toast,
    t: i18n.t,
    locale: i18n.locale,
    fallbackLocale: i18n.fallbackLocale,
  };
}

function registerCoverLetterPageSeo(t: CoverLetterPageServices["t"]) {
  if (import.meta.server) {
    useServerSeoMeta({
      title: t("coverLetterPage.title"),
      description: t("coverLetterPage.subtitle"),
    });
  }
}

function createCoverLetterGenerateForm(resumeId = "") {
  return reactive<CoverLetterGenerateForm>({
    company: "",
    position: "",
    jobDescription: "",
    resumeId,
    template: COVER_LETTER_DEFAULT_TEMPLATE,
  });
}

function createCoverLetterPageState() {
  const initialResumeId = ref("");
  const deleteState = useDeleteConfirmation();

  return {
    showGenerateModal: ref(false),
    generating: ref(false),
    initialResumeId,
    generateForm: createCoverLetterGenerateForm(),
    searchQuery: ref(""),
    templateFilter: ref<CoverLetterTemplate | "all">("all"),
    sortOrder: ref<CoverLetterSortOrder>("newest"),
    ...deleteState,
  };
}

function previewContent(value: string): string {
  if (value.length <= COVER_LETTER_CONTENT_PREVIEW_LENGTH) {
    return value;
  }
  return `${value.slice(0, COVER_LETTER_CONTENT_PREVIEW_LENGTH)}…`;
}

function hasCoverLetterId(letter: CoverLetterData): letter is CoverLetterData & { id: string } {
  return typeof letter.id === "string" && letter.id.trim().length > 0;
}

function resolveTemplateLabel(
  t: CoverLetterPageServices["t"],
  template: CoverLetterTemplate,
): string {
  return t(`coverLetterPage.templates.${template}`);
}

function createFilteredCoverLetters(
  services: CoverLetterPageServices,
  state: CoverLetterPageState,
) {
  return computed(() => {
    const query = state.searchQuery.value.trim().toLowerCase();
    const items = services.coverLetters.value.filter((letter) => {
      if (state.templateFilter.value !== "all") {
        const activeTemplate = letter.template ?? COVER_LETTER_DEFAULT_TEMPLATE;
        if (activeTemplate !== state.templateFilter.value) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const content = coverLetterContentToPlainText(letter.content).toLowerCase();
      return (
        letter.company.toLowerCase().includes(query) ||
        letter.position.toLowerCase().includes(query) ||
        content.includes(query)
      );
    });

    return [...items].sort((left, right) => {
      const leftDate = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightDate = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return state.sortOrder.value === "newest" ? rightDate - leftDate : leftDate - rightDate;
    });
  });
}

function createTemplateFilterOptions(t: CoverLetterPageServices["t"]) {
  return computed(() => [
    { value: "all", label: t("coverLetterPage.filters.templateAll") },
    ...COVER_LETTER_TEMPLATE_OPTIONS.map((template) => ({
      value: template,
      label: resolveTemplateLabel(t, template),
    })),
  ]);
}

function createCoverLetterFilterState(
  services: CoverLetterPageServices,
  state: CoverLetterPageState,
) {
  const filteredCoverLetters = createFilteredCoverLetters(services, state);
  const displayCoverLetters = computed(() => filteredCoverLetters.value.filter(hasCoverLetterId));
  const pagination = usePagination(displayCoverLetters, COVER_LETTER_LIST_PAGE_SIZE, [
    state.searchQuery,
    state.templateFilter,
    state.sortOrder,
  ]);

  return {
    filteredCoverLetters,
    displayCoverLetters,
    coverLetterPagination: pagination,
    coverLetterPaginationSummary: computed(() =>
      services.t("coverLetterPage.pagination.summary", {
        start: pagination.rangeStart.value,
        end: pagination.rangeEnd.value,
        total: pagination.totalItems.value,
      }),
    ),
    templateUsageCount: computed(
      () =>
        new Set(
          services.coverLetters.value.map(
            (letter) => letter.template ?? COVER_LETTER_DEFAULT_TEMPLATE,
          ),
        ).size,
    ),
    hasFiltersApplied: computed(
      () =>
        state.searchQuery.value.trim().length > 0 ||
        state.templateFilter.value !== "all" ||
        state.sortOrder.value !== "newest",
    ),
    templateFilterOptions: createTemplateFilterOptions(services.t),
    sortOptions: computed(() => [
      { value: "newest" as const, label: services.t("coverLetterPage.filters.sortNewest") },
      { value: "oldest" as const, label: services.t("coverLetterPage.filters.sortOldest") },
    ]),
  };
}

function buildPreviewText(
  t: CoverLetterPageServices["t"],
  content: Record<string, string | undefined>,
): string {
  const plainText = coverLetterContentToPlainText(content);
  if (!plainText) {
    return t("coverLetterPage.cards.emptyPreview");
  }
  return previewContent(plainText);
}

function formatCreatedAt(services: CoverLetterPageServices, value: string | undefined): string {
  if (!value) {
    return services.t("coverLetterPage.notAvailable");
  }

  const formatted = formatDateWithLocale(
    value,
    services.locale.value,
    services.fallbackLocale.value,
    { year: "numeric", month: "short", day: "numeric" },
  );
  return formatted ?? services.t("coverLetterPage.notAvailable");
}

function createCoverLetterCards(
  services: CoverLetterPageServices,
  pagination: CoverLetterFilterState["coverLetterPagination"],
) {
  return computed(() =>
    pagination.items.value.map((letter) => ({
      id: letter.id,
      company: letter.company,
      position: letter.position,
      templateLabel: resolveTemplateLabel(
        services.t,
        resolveTemplate(letter.template || COVER_LETTER_DEFAULT_TEMPLATE),
      ),
      previewText: buildPreviewText(services.t, letter.content),
      updatedAtLabel: formatCreatedAt(services, letter.updatedAt || letter.createdAt),
    })),
  );
}

function resolveTemplate(value: string): CoverLetterTemplate {
  return isCoverLetterTemplate(value) ? value : COVER_LETTER_DEFAULT_TEMPLATE;
}

export function useCoverLetterListPage() {
  const services = createCoverLetterPageServices();
  registerCoverLetterPageSeo(services.t);

  const state = createCoverLetterPageState();
  const filterState = createCoverLetterFilterState(services, state);
  const actions = createCoverLetterActions(services, state);
  const coverLetterCards = createCoverLetterCards(services, filterState.coverLetterPagination);

  useCoverLetterPageBootstrap(services, state);

  return {
    coverLetters: services.coverLetters,
    loading: services.loading,
    resumes: services.resumes,
    COVER_LETTER_COMPANY_MIN_LENGTH,
    COVER_LETTER_GENERATE_DIALOG_TITLE_ID,
    COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
    COVER_LETTER_POSITION_MIN_LENGTH,
    COVER_LETTER_TEMPLATE_OPTIONS,
    coverLetterCards,
    ...state,
    ...filterState,
    ...actions,
    templateLabel: (template: CoverLetterTemplate) => resolveTemplateLabel(services.t, template),
  };
}
