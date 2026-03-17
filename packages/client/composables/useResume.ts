import { API_ENDPOINTS, type ResumeData, type ResumeTemplate, STATE_KEYS } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { getStoredApiKey } from "~/plugins/eden";
import { resolveApiEndpoint } from "~/utils/endpoints";
import { toResumeData } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

type ApiClient = ReturnType<typeof useApi>;
type CreateResumeInput = NonNullable<Parameters<ApiClient["resumes"]["post"]>[0]>;
type ResumeRoute = ReturnType<ApiClient["resumes"]>;
type UpdateResumeInput = NonNullable<Parameters<ResumeRoute["put"]>[0]>;
type ExportResumeInput = NonNullable<Parameters<ResumeRoute["export"]["post"]>[0]>;
type ScoreResumeInput = NonNullable<Parameters<ResumeRoute["ai-score"]["post"]>[0]>;
type ScoreResumeResult = Awaited<ReturnType<ResumeRoute["ai-score"]["post"]>>;
type ScoreResumeData = NonNullable<ScoreResumeResult["data"]>;
type ScoreResumeError = Extract<ScoreResumeData, { error: string }>;
type ScoreResumeSuccess = Exclude<ScoreResumeData, ScoreResumeError>;

type ResumeSynthesisSuccess = Partial<ResumeData> & {
  id: string;
  name?: string;
  personalInfo?: ResumeData["personalInfo"];
};

type ResumeSynthesisError = {
  error?: string;
  details?: string;
};

interface ResumeContext {
  api: ApiClient;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  currentResume: ReturnType<typeof useState<ResumeData | null>>;
  apiBase: string;
  requestUrl: URL;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isResumeSynthesisError = (
  value: ResumeSynthesisSuccess | ResumeSynthesisError,
): value is ResumeSynthesisError => "error" in value && typeof value.error === "string";

const isResumeSynthesisSuccess = (
  value: ResumeSynthesisSuccess | ResumeSynthesisError,
): value is ResumeSynthesisSuccess =>
  isRecord(value) && "id" in value && typeof value.id === "string";

const isResumeScoreError = (value: ScoreResumeData): value is ScoreResumeError =>
  "error" in value && typeof value.error === "string";

function toResumeList(value: unknown): ResumeData[] {
  return Array.isArray(value)
    ? value
        .map((entry) => toResumeData(entry))
        .filter((entry): entry is ResumeData => entry !== null)
    : [];
}

function toExportPayload(template?: ResumeTemplate): ExportResumeInput {
  return template ? { template } : {};
}

async function fetchResumes(context: ResumeContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.resumes.get();
    assertApiResponse(error, context.t("apiErrors.resumes.fetchListFailed"));
    context.resumes.value = toResumeList(data);
  });
}

async function getResume(context: ResumeContext, id: string): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.resumes({ id }).get();
    assertApiResponse(error, context.t("apiErrors.resumes.fetchFailed"));
    const normalized = requireValue(
      toResumeData(data),
      context.t("apiErrors.resumes.invalidPayload"),
    );
    context.currentResume.value = normalized;
    return normalized;
  });
}

async function createResume(
  context: ResumeContext,
  resumeData: CreateResumeInput,
): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.resumes.post(resumeData);
    assertApiResponse(error, context.t("apiErrors.resumes.createFailed"));
    const normalized = requireValue(
      toResumeData(data),
      context.t("apiErrors.resumes.invalidPayload"),
    );
    await fetchResumes(context);
    return normalized;
  });
}

async function updateResume(
  context: ResumeContext,
  id: string,
  updates: UpdateResumeInput,
): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.resumes({ id }).put(updates);
    assertApiResponse(error, context.t("apiErrors.resumes.updateFailed"));
    const normalized = requireValue(
      toResumeData(data),
      context.t("apiErrors.resumes.invalidPayload"),
    );
    context.currentResume.value = normalized;
    await fetchResumes(context);
    return normalized;
  });
}

async function deleteResume(context: ResumeContext, id: string): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const { error } = await context.api.resumes({ id }).delete();
    assertApiResponse(error, context.t("apiErrors.resumes.deleteFailed"));
    if (context.currentResume.value?.id === id) {
      context.currentResume.value = null;
    }
    await fetchResumes(context);
  });
}

async function exportResume(
  context: ResumeContext,
  id: string,
  template?: ResumeTemplate,
): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api
      .resumes({ id })
      .export.post(toExportPayload(template));
    assertApiResponse(error, context.t("apiErrors.resumes.exportFailed"));
    return data;
  });
}

async function exportResumeOnePage(
  context: ResumeContext,
  id: string,
  template?: ResumeTemplate,
): Promise<unknown> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api
      .resumes({ id })
      .export.post(toExportPayload(template));
    assertApiResponse(error, context.t("apiErrors.resumes.exportOnePageFailed"));
    return data;
  });
}

async function aiEnhance(context: ResumeContext, id: string): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.resumes({ id })["ai-enhance"].post({});
    assertApiResponse(error, context.t("apiErrors.resumes.enhanceFailed"));
    const normalized = requireValue(
      toResumeData(data),
      context.t("apiErrors.resumes.invalidPayload"),
    );
    context.currentResume.value = normalized;
    await fetchResumes(context);
    return normalized;
  });
}

async function aiScore(context: ResumeContext, id: string, jobId: string): Promise<ScoreResumeSuccess> {
  return withLoadingState(context.loading, async () => {
    const payload: ScoreResumeInput = { jobId };
    const { data, error } = await context.api.resumes({ id })["ai-score"].post(payload);
    assertApiResponse(error, context.t("apiErrors.resumes.scoreFailed"));
    const normalized = requireValue(data, context.t("apiErrors.resumes.invalidPayload"));
    if (isResumeScoreError(normalized)) {
      throw new Error(
        String(normalized.details ?? normalized.error ?? context.t("apiErrors.resumes.scoreFailed")),
      );
    }
    return normalized;
  });
}

async function generateCvQuestions(
  context: ResumeContext,
  config: {
    targetRole: string;
    studioName?: string;
    experienceLevel?: string;
  },
): Promise<Array<{ id: string; question: string; category: string }>> {
  const key = getStoredApiKey();
  const response = await $fetch<{
    questions?: Array<{ id: string; question: string; category: string }>;
    error?: string;
  }>(
    resolveApiEndpoint(
      context.apiBase,
      context.requestUrl,
      API_ENDPOINTS.resumesFromQuestionsGenerate,
    ),
    {
      method: "POST",
      body: config,
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    },
  );

  if ("error" in response && response.error) {
    throw new Error(response.error);
  }

  return response.questions ?? [];
}

async function synthesizeCvResume(
  context: ResumeContext,
  questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
): Promise<ResumeSynthesisSuccess> {
  const key = getStoredApiKey();
  const response = await $fetch<ResumeSynthesisSuccess | ResumeSynthesisError>(
    resolveApiEndpoint(
      context.apiBase,
      context.requestUrl,
      API_ENDPOINTS.resumesFromQuestionsSynthesize,
    ),
    {
      method: "POST",
      body: { questionsAndAnswers },
      headers: key ? { Authorization: `Bearer ${key}` } : {},
    },
  );

  if (isResumeSynthesisError(response) && response.error) {
    throw new Error(String(response.details ?? response.error ?? "Unknown error"));
  }
  if (!isResumeSynthesisSuccess(response)) {
    throw new Error("Resume synthesis payload is missing an id");
  }

  return response;
}

/**
 * Resume management composable.
 */
export function useResume() {
  const context: ResumeContext = {
    api: useApi(),
    t: useI18n().t,
    requestUrl: useRequestURL(),
    apiBase: String(useRuntimeConfig().public.apiBase || "/"),
    resumes: useState<ResumeData[]>(STATE_KEYS.RESUME_LIST, () => []),
    currentResume: useState<ResumeData | null>(STATE_KEYS.RESUME_CURRENT, () => null),
    loading: useState(STATE_KEYS.RESUME_LOADING, () => false),
  };

  return {
    resumes: readonly(context.resumes),
    currentResume: readonly(context.currentResume),
    loading: readonly(context.loading),
    fetchResumes: () => fetchResumes(context),
    getResume: (id: string) => getResume(context, id),
    createResume: (resumeData: CreateResumeInput) => createResume(context, resumeData),
    updateResume: (id: string, updates: UpdateResumeInput) => updateResume(context, id, updates),
    deleteResume: (id: string) => deleteResume(context, id),
    exportResume: (id: string, template?: ResumeTemplate) => exportResume(context, id, template),
    exportResumeOnePage: (id: string, template?: ResumeTemplate) =>
      exportResumeOnePage(context, id, template),
    aiEnhance: (id: string) => aiEnhance(context, id),
    aiScore: (id: string, jobId: string) => aiScore(context, id, jobId),
    generateCvQuestions: (config: {
      targetRole: string;
      studioName?: string;
      experienceLevel?: string;
    }) => generateCvQuestions(context, config),
    synthesizeCvResume: (
      questionsAndAnswers: Array<{
        id: string;
        question: string;
        answer: string;
        category: string;
      }>,
    ) => synthesizeCvResume(context, questionsAndAnswers),
  };
}
