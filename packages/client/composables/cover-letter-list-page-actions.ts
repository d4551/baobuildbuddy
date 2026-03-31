import {
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
  COVER_LETTER_POSITION_MIN_LENGTH,
  type CoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import { APP_ROUTE_BUILDERS, APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import type { Ref } from "vue";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import type { GenerateCoverLetterInput, GenerateCoverLetterResult } from "./useCoverLetter";

export type CoverLetterGenerateForm = {
  company: string;
  position: string;
  jobDescription: string;
  resumeId: string;
  template: CoverLetterTemplate;
};

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;
type ToastApi = {
  error(message: string): void;
  success(message: string): void;
};

type CoverLetterPageActionServices = {
  deleteCoverLetter(id: string): Promise<void>;
  generateCoverLetter(payload: GenerateCoverLetterInput): Promise<GenerateCoverLetterResult | null>;
  fetchCoverLetters(): Promise<void>;
  fetchResumes(): Promise<void>;
  router: { push(path: string): Promise<unknown> };
  route: { query: Record<string, unknown> };
  $toast: ToastApi;
  t: TranslateFn;
};

type CoverLetterPageActionState = {
  showGenerateModal: Ref<boolean>;
  generating: Ref<boolean>;
  initialResumeId: Ref<string>;
  generateForm: CoverLetterGenerateForm;
  pendingDeleteId: Ref<string | null>;
  closeDeleteDialog(): void;
  searchQuery: Ref<string>;
  templateFilter: Ref<CoverLetterTemplate | "all">;
  sortOrder: Ref<"newest" | "oldest">;
};

function resetGenerateForm(state: CoverLetterPageActionState) {
  state.generateForm.company = "";
  state.generateForm.position = "";
  state.generateForm.jobDescription = "";
  state.generateForm.resumeId = state.initialResumeId.value;
  state.generateForm.template = COVER_LETTER_DEFAULT_TEMPLATE;
}

function initializeResumeSelection(
  state: Pick<CoverLetterPageActionState, "generateForm" | "initialResumeId">,
  route: CoverLetterPageActionServices["route"],
) {
  const routeResumeId = route.query[APP_ROUTE_QUERY_KEYS.resumeId];
  if (typeof routeResumeId === "string" && routeResumeId.trim().length > 0) {
    state.initialResumeId.value = routeResumeId.trim();
    state.generateForm.resumeId = state.initialResumeId.value;
  }
}

function validateGenerateForm(state: CoverLetterPageActionState, toast: ToastApi, t: TranslateFn) {
  if (state.generateForm.company.trim().length < COVER_LETTER_COMPANY_MIN_LENGTH) {
    toast.error(
      t("coverLetterPage.toasts.companyMinLength", {
        count: COVER_LETTER_COMPANY_MIN_LENGTH,
      }),
    );
    return false;
  }

  if (state.generateForm.position.trim().length < COVER_LETTER_POSITION_MIN_LENGTH) {
    toast.error(
      t("coverLetterPage.toasts.positionMinLength", {
        count: COVER_LETTER_POSITION_MIN_LENGTH,
      }),
    );
    return false;
  }

  const description = state.generateForm.jobDescription.trim();
  if (description.length > 0 && description.length < COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH) {
    toast.error(
      t("coverLetterPage.toasts.jobDescriptionMinLength", {
        count: COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
      }),
    );
    return false;
  }

  return true;
}

function buildGeneratePayload(state: CoverLetterPageActionState) {
  const description = state.generateForm.jobDescription.trim();
  return {
    company: state.generateForm.company.trim(),
    position: state.generateForm.position.trim(),
    resumeId:
      state.generateForm.resumeId.trim().length > 0
        ? state.generateForm.resumeId.trim()
        : undefined,
    template: state.generateForm.template,
    save: true,
    ...(description.length > 0 ? { jobInfo: { description } } : {}),
  };
}

function createEditLetterAction(services: Pick<CoverLetterPageActionServices, "router">) {
  return async (id: string) => {
    await services.router.push(APP_ROUTE_BUILDERS.coverLetterDetail(id));
  };
}

function createDeleteCoverLetterHandler(
  services: CoverLetterPageActionServices,
  state: CoverLetterPageActionState,
) {
  return async () => {
    const id = state.pendingDeleteId.value;
    if (!id) {
      return;
    }

    const deleteResult = await settlePromise(
      services.deleteCoverLetter(id),
      services.t("coverLetterPage.toasts.deleteFailed"),
    );
    state.closeDeleteDialog();

    if (!deleteResult.ok) {
      services.$toast.error(
        getErrorMessage(deleteResult.error, services.t("coverLetterPage.toasts.deleteFailed")),
      );
      return;
    }

    services.$toast.success(services.t("coverLetterPage.toasts.deleted"));
  };
}

function resolveGeneratedCoverLetterId(result: GenerateCoverLetterResult | null): string | null {
  if (!(result && "coverLetter" in result)) {
    return null;
  }

  return result.coverLetter.id ?? null;
}

function createGenerateCoverLetterHandler(
  services: CoverLetterPageActionServices,
  state: CoverLetterPageActionState,
) {
  return async () => {
    if (!validateGenerateForm(state, services.$toast, services.t)) {
      return;
    }

    state.generating.value = true;
    const generateResult = await settlePromise(
      services.generateCoverLetter(buildGeneratePayload(state)),
      services.t("coverLetterPage.toasts.generateFailed"),
    );
    state.generating.value = false;

    if (!generateResult.ok) {
      services.$toast.error(
        getErrorMessage(generateResult.error, services.t("coverLetterPage.toasts.generateFailed")),
      );
      return;
    }

    state.showGenerateModal.value = false;
    resetGenerateForm(state);
    const generatedId = resolveGeneratedCoverLetterId(generateResult.value);
    if (!generatedId) {
      services.$toast.success(services.t("coverLetterPage.toasts.generatedWithoutRedirect"));
      return;
    }

    services.$toast.success(services.t("coverLetterPage.toasts.generated"));
    await services.router.push(APP_ROUTE_BUILDERS.coverLetterDetail(generatedId));
  };
}

export function createCoverLetterActions(
  services: CoverLetterPageActionServices,
  state: CoverLetterPageActionState,
) {
  const clearFilters = () => {
    state.searchQuery.value = "";
    state.templateFilter.value = "all";
    state.sortOrder.value = "newest";
  };

  const coverLetterPageAria = (page: number) =>
    services.t("coverLetterPage.pagination.pageAria", { page });

  return {
    clearFilters,
    coverLetterPageAria,
    editLetter: createEditLetterAction(services),
    handleDeleteCoverLetter: createDeleteCoverLetterHandler(services, state),
    handleGenerate: createGenerateCoverLetterHandler(services, state),
  };
}

export function useCoverLetterPageBootstrap(
  services: Pick<
    CoverLetterPageActionServices,
    "fetchCoverLetters" | "fetchResumes" | "route" | "$toast" | "t"
  >,
  state: Pick<CoverLetterPageActionState, "generateForm" | "initialResumeId">,
) {
  return useAsyncData("cover-letter-page-bootstrap", async () => {
    initializeResumeSelection(state, services.route);
    const [coverLettersResult, resumesResult] = await Promise.all([
      settlePromise(services.fetchCoverLetters(), services.t("coverLetterPage.toasts.fetchFailed")),
      settlePromise(services.fetchResumes(), services.t("apiErrors.resumes.fetchListFailed")),
    ]);

    if (!coverLettersResult.ok) {
      const failure = getErrorMessage(
        coverLettersResult.error,
        services.t("coverLetterPage.toasts.fetchFailed"),
      );
      services.$toast.error(failure);
      throw coverLettersResult.error;
    }

    if (!resumesResult.ok) {
      const failure = getErrorMessage(
        resumesResult.error,
        services.t("apiErrors.resumes.fetchListFailed"),
      );
      services.$toast.error(failure);
      throw resumesResult.error;
    }

    return true;
  });
}
