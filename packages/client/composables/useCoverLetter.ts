import {
  API_ENDPOINTS,
  buildCoverLetterDetailEndpoint,
  buildCoverLetterExportEndpoint,
} from "@bao/shared/constants/endpoints";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { CoverLetterData } from "@bao/shared/types/cover-letter";
import { isRecord } from "@bao/shared/utils/type-guards";
import { useI18n } from "vue-i18n";
import { toCoverLetterData } from "./api-normalizer-cover-letter";
import {
  downloadApiFile,
  type ClientApiRequestRuntime,
  requestApi,
  useClientApiRequestRuntime,
} from "./api-request";

interface CreateCoverLetterInput {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  content?: CoverLetterData["content"];
  template?: CoverLetterData["template"];
}

type UpdateCoverLetterInput = Partial<CreateCoverLetterInput>;

export interface GenerateCoverLetterInput {
  company: string;
  position: string;
  resumeId?: string;
  template?: CoverLetterData["template"];
  save?: boolean;
  jobInfo?: Record<string, unknown>;
}

export type GenerateCoverLetterResult =
  | {
      message: string;
      content: CoverLetterData["content"];
    }
  | {
      message: string;
      coverLetter: CoverLetterData;
    };

interface CoverLetterContext {
  runtime: ClientApiRequestRuntime;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
  coverLetters: ReturnType<typeof useState<CoverLetterData[]>>;
  currentLetter: ReturnType<typeof useState<CoverLetterData | null>>;
}

const readApiData = async (
  request: Promise<unknown>,
  fallbackMessage: string,
): Promise<unknown> => {
  const response = await request;
  if (!(isRecord(response) || Array.isArray(response))) {
    throw new Error(fallbackMessage);
  }
  if (isRecord(response) && "error" in response && response.error) {
    throw new Error(fallbackMessage);
  }
  if (isRecord(response) && "data" in response) {
    return response.data;
  }
  return response;
};

const toCoverLetterContent = (value: unknown): CoverLetterData["content"] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const content: CoverLetterData["content"] = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      content[key] = entry;
    }
  }

  return Object.keys(content).length > 0 ? content : null;
};

const toGenerateCoverLetterResult = (value: unknown): GenerateCoverLetterResult | null => {
  if (!isRecord(value)) {
    return null;
  }

  const message = typeof value.message === "string" ? value.message : "";
  const content = toCoverLetterContent(value.content);
  if (content) {
    return { message, content };
  }

  const coverLetter = toCoverLetterData(value.coverLetter);
  if (!coverLetter) {
    return null;
  }

  return {
    message,
    coverLetter,
  };
};

async function fetchCoverLetters(context: CoverLetterContext): Promise<void> {
  context.loading.value = true;
  const data = await readApiData(
    requestApi<unknown>(context.runtime, API_ENDPOINTS.coverLetters, {
      method: "GET",
    }),
    context.t("coverLetterPage.toasts.fetchFailed"),
  );
  context.loading.value = false;

  const rows = Array.isArray(data) ? data : [];
  context.coverLetters.value = rows
    .map((row) => toCoverLetterData(row))
    .filter((row): row is CoverLetterData => row !== null);
}

async function getCoverLetter(
  context: CoverLetterContext,
  id: string,
): Promise<CoverLetterData | null> {
  context.loading.value = true;
  const data = await readApiData(
    requestApi<unknown>(context.runtime, buildCoverLetterDetailEndpoint(id), {
      method: "GET",
    }),
    context.t("coverLetterDetailPage.toasts.loadFailed"),
  );
  context.loading.value = false;

  const normalized = toCoverLetterData(data);
  if (!normalized) {
    context.toast.error(context.t("coverLetterDetailPage.toasts.loadFailed"));
    return null;
  }

  context.currentLetter.value = normalized;
  return normalized;
}

async function createCoverLetter(
  context: CoverLetterContext,
  letterData: CreateCoverLetterInput,
): Promise<CoverLetterData | null> {
  context.loading.value = true;
  const data = await readApiData(
    requestApi<unknown>(context.runtime, API_ENDPOINTS.coverLetters, {
      method: "POST",
      body: letterData,
    }),
    context.t("coverLetterPage.toasts.generateFailed"),
  );
  context.loading.value = false;

  const normalized = toCoverLetterData(data);
  if (!normalized) {
    context.toast.error(context.t("coverLetterPage.toasts.generateFailed"));
    return null;
  }

  await fetchCoverLetters(context);
  return normalized;
}

async function updateCoverLetter(
  context: CoverLetterContext,
  id: string,
  updates: UpdateCoverLetterInput,
): Promise<CoverLetterData | null> {
  context.loading.value = true;
  const data = await readApiData(
    requestApi<unknown>(context.runtime, buildCoverLetterDetailEndpoint(id), {
      method: "PUT",
      body: updates,
    }),
    context.t("coverLetterDetailPage.toasts.saveFailed"),
  );
  context.loading.value = false;

  const normalized = toCoverLetterData(data);
  if (normalized) {
    context.currentLetter.value = normalized;
  }
  await fetchCoverLetters(context);
  return normalized;
}

async function deleteCoverLetter(context: CoverLetterContext, id: string): Promise<void> {
  context.loading.value = true;
  await requestApi<unknown>(context.runtime, buildCoverLetterDetailEndpoint(id), {
    method: "DELETE",
  });
  context.loading.value = false;

  if (context.currentLetter.value?.id === id) {
    context.currentLetter.value = null;
  }
  await fetchCoverLetters(context);
}

async function generateCoverLetter(
  context: CoverLetterContext,
  generationData: GenerateCoverLetterInput,
): Promise<GenerateCoverLetterResult | null> {
  context.loading.value = true;
  const data = await readApiData(
    requestApi<unknown>(context.runtime, API_ENDPOINTS.coverLettersGenerate, {
      method: "POST",
      body: generationData,
    }),
    context.t("coverLetterPage.toasts.generateFailed"),
  );
  context.loading.value = false;

  if (generationData.save) {
    await fetchCoverLetters(context);
  }
  return toGenerateCoverLetterResult(data);
}

async function exportDocument(
  context: CoverLetterContext,
  id: string,
  format?: string,
): Promise<void> {
  context.loading.value = true;
  await downloadApiFile(
    context.runtime,
    buildCoverLetterExportEndpoint(id),
    {
      method: "POST",
      body: format ? { format } : {},
    },
    `cover-letter-${id}.${format === "docx" ? "docx" : "pdf"}`,
  );
  context.loading.value = false;
}

/**
 * Cover letter management composable.
 */
export function useCoverLetter() {
  const context: CoverLetterContext = {
    runtime: useClientApiRequestRuntime(),
    toast: useNuxtApp().$toast,
    t: useI18n().t,
    coverLetters: useState<CoverLetterData[]>(STATE_KEYS.COVERLETTERS_LIST, () => []),
    currentLetter: useState<CoverLetterData | null>(STATE_KEYS.COVERLETTER_CURRENT, () => null),
    loading: useState(STATE_KEYS.COVERLETTER_LOADING, () => false),
  };

  return {
    coverLetters: readonly(context.coverLetters),
    currentLetter: readonly(context.currentLetter),
    loading: readonly(context.loading),
    fetchCoverLetters: () => fetchCoverLetters(context),
    getCoverLetter: (id: string) => getCoverLetter(context, id),
    createCoverLetter: (letterData: CreateCoverLetterInput) =>
      createCoverLetter(context, letterData),
    updateCoverLetter: (id: string, updates: UpdateCoverLetterInput) =>
      updateCoverLetter(context, id, updates),
    deleteCoverLetter: (id: string) => deleteCoverLetter(context, id),
    generateCoverLetter: (generationData: GenerateCoverLetterInput) =>
      generateCoverLetter(context, generationData),
    exportDocument: (id: string, format?: string) => exportDocument(context, id, format),
  };
}
