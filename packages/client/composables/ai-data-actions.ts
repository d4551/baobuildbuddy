import type { ComposerTranslation } from "vue-i18n";
import { assertApiResponse, withLoadingState } from "~/composables/async-flow";

interface CoverLetterGenerationInput {
  company: string;
  position: string;
  resumeId: string;
  jobId?: string;
}

interface DataActionInput {
  api: ReturnType<typeof useApi>;
  t: ComposerTranslation;
  loading: ReturnType<typeof useState<boolean>>;
}

export function createDataActions(input: DataActionInput) {
  const analyzeResume = async (resumeId: string) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["analyze-resume"].post({ resumeId });
      assertApiResponse(error, input.t("apiErrors.ai.analyzeResumeFailed"));
      return data;
    });

  const generateCoverLetter = async (generationData: CoverLetterGenerationInput) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["generate-cover-letter"].post(generationData);
      assertApiResponse(error, input.t("apiErrors.ai.generateCoverLetterFailed"));
      return data;
    });

  const matchJobs = async (resumeId: string) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["match-jobs"].post({ resumeId });
      assertApiResponse(error, input.t("apiErrors.ai.matchJobsFailed"));
      return data;
    });

  const getModels = async () =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai.models.get();
      assertApiResponse(error, input.t("apiErrors.ai.fetchModelsFailed"));
      return data;
    });

  const getUsage = async () =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai.usage.get();
      assertApiResponse(error, input.t("apiErrors.ai.fetchUsageFailed"));
      return data;
    });

  return {
    analyzeResume,
    generateCoverLetter,
    matchJobs,
    getModels,
    getUsage,
  };
}
