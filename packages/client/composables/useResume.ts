import { buildResumeExportEndpoint } from "@bao/shared/constants/endpoints";
import type { ResumeTemplate } from "@bao/shared/constants/resume";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { ResumeData } from "@bao/shared/types/resume";
import { isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import type { ClientApi } from "~/types/client-api";
import { readRequiredApiPayload } from "~/utils/api-response";
import { toResumeData } from "./api-normalizer-resume";
import {
  type ClientApiRequestRuntime,
  downloadApiFile,
  useClientApiRequestRuntime,
} from "./api-request";
import { requireValue, withLoadingState } from "./async-flow";
import { useApi } from "./useApi";

type CreateResumeInput = Record<string, unknown>;
type UpdateResumeInput = Record<string, unknown>;
type ExportResumeInput = Record<string, unknown>;
type ScoreResumeInput = {
  jobId: string;
};
type ScoreResumeError = {
  details?: string;
  error: string;
};
type ScoreResumeSuccess = {
  [key: string]: unknown;
  details?: unknown;
  error?: undefined;
  score?: unknown;
};

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
  api: ClientApi;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  currentResume: ReturnType<typeof useState<ResumeData | null>>;
  runtime: ClientApiRequestRuntime;
}

interface ResumeExportRequest {
  id: string;
  template?: ResumeTemplate;
  format?: string;
}

const isResumeSynthesisError = (value: unknown): value is ResumeSynthesisError =>
  isRecord(value) && typeof value.error === "string";

const isResumeSynthesisSuccess = (value: unknown): value is ResumeSynthesisSuccess =>
  isRecord(value) && "id" in value && typeof value.id === "string";

const isResumeScoreError = (value: unknown): value is ScoreResumeError =>
  isRecord(value) && typeof value.error === "string";

const isResumeScoreSuccess = (value: unknown): value is ScoreResumeSuccess =>
  isRecord(value) && !("error" in value);

function toResumeList(value: unknown): ResumeData[] {
  return Array.isArray(value)
    ? value
        .map((entry) => toResumeData(entry))
        .filter((entry): entry is ResumeData => entry !== null)
    : [];
}

function toExportPayload(template?: ResumeTemplate, format?: string): ExportResumeInput {
  const payload: ExportResumeInput = {};
  if (template) {
    payload.template = template;
  }
  if (format) {
    payload.format = format;
  }
  return payload;
}

async function fetchResumes(context: ResumeContext): Promise<void> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.resumes.get(),
      context.t("apiErrors.resumes.fetchListFailed"),
    );
    context.resumes.value = toResumeList(data);
  });
}

async function getResume(context: ResumeContext, id: string): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.resumes({ id }).get(),
      context.t("apiErrors.resumes.fetchFailed"),
    );
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
    const data = await readRequiredApiPayload(
      context.api.resumes.post(resumeData),
      context.t("apiErrors.resumes.createFailed"),
    );
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
    const data = await readRequiredApiPayload(
      context.api.resumes({ id }).put(updates),
      context.t("apiErrors.resumes.updateFailed"),
    );
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
    await readRequiredApiPayload(
      context.api.resumes({ id }).delete(),
      context.t("apiErrors.resumes.deleteFailed"),
    );
    if (context.currentResume.value?.id === id) {
      context.currentResume.value = null;
    }
    await fetchResumes(context);
  });
}

async function performExportResume(
  context: ResumeContext,
  request: ResumeExportRequest,
): Promise<void> {
  return withLoadingState(context.loading, async () => {
    await downloadApiFile(
      context.runtime,
      buildResumeExportEndpoint(request.id),
      {
        method: "POST",
        body: toExportPayload(request.template, request.format),
      },
      `resume-${request.id}.${request.format === "docx" ? "docx" : "pdf"}`,
    );
  });
}

async function exportResume(
  context: ResumeContext,
  id: string,
  template?: ResumeTemplate,
  format?: string,
): Promise<unknown> {
  return performExportResume(context, {
    id,
    template,
    format,
  });
}

async function exportResumeOnePage(
  context: ResumeContext,
  id: string,
  template?: ResumeTemplate,
  format?: string,
): Promise<unknown> {
  return performExportResume(context, {
    id,
    template,
    format,
  });
}

async function aiEnhance(context: ResumeContext, id: string): Promise<ResumeData> {
  return withLoadingState(context.loading, async () => {
    const data = await readRequiredApiPayload(
      context.api.resumes({ id })["ai-enhance"].post({}),
      context.t("apiErrors.resumes.enhanceFailed"),
    );
    const normalized = requireValue(
      toResumeData(data),
      context.t("apiErrors.resumes.invalidPayload"),
    );
    context.currentResume.value = normalized;
    await fetchResumes(context);
    return normalized;
  });
}

async function aiScore(
  context: ResumeContext,
  id: string,
  jobId: string,
): Promise<ScoreResumeSuccess> {
  return withLoadingState(context.loading, async () => {
    const payload: ScoreResumeInput = { jobId };
    const data = await readRequiredApiPayload(
      context.api.resumes({ id })["ai-score"].post(payload),
      context.t("apiErrors.resumes.scoreFailed"),
    );
    if (isResumeScoreError(data)) {
      throw new Error(
        String(data.details ?? data.error ?? context.t("apiErrors.resumes.scoreFailed")),
      );
    }
    if (!isResumeScoreSuccess(data)) {
      throw new Error(context.t("apiErrors.resumes.scoreFailed"));
    }
    return data;
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
  const data = await readRequiredApiPayload(
    context.api.resumes["from-questions"].generate.post(config),
    context.t("apiErrors.resumes.fetchFailed"),
  );
  if (!isRecord(data) || !Array.isArray(data.questions)) {
    return [];
  }
  return data.questions.filter(
    (entry): entry is { id: string; question: string; category: string } =>
      isRecord(entry) &&
      typeof entry.id === "string" &&
      typeof entry.question === "string" &&
      typeof entry.category === "string",
  );
}

async function synthesizeCvResume(
  context: ResumeContext,
  questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
): Promise<ResumeSynthesisSuccess> {
  const response = await readRequiredApiPayload(
    context.api.resumes["from-questions"].synthesize.post({ questionsAndAnswers }),
    context.t("apiErrors.resumes.createFailed"),
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
 * Resume management composable — Eden JSON fabric; binary export stays downloadApiFile.
 */
export function useResume() {
  const context: ResumeContext = {
    api: useApi(),
    t: useI18n().t,
    runtime: useClientApiRequestRuntime(),
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
    exportResume: (id: string, template?: ResumeTemplate, format?: string) =>
      exportResume(context, id, template, format),
    exportResumeOnePage: (id: string, template?: ResumeTemplate, format?: string) =>
      exportResumeOnePage(context, id, template, format),
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
