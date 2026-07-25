import {
  API_ERROR_GENERATE_QUESTIONS,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_SYNTHESIZE_RESUME,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import {
  RESUME_DEFAULT_NAME,
  RESUME_DEFAULT_NAME_QUESTIONNAIRE,
  RESUME_DEFAULT_THEME,
  RESUME_TEMPLATE_DEFAULT,
} from "@bao/shared/constants/resume";
import type { ResumeData } from "@bao/shared/types/resume";
import { settle } from "@bao/shared/utils/promise";
import { Elysia, type status } from "elysia";
import { cvQuestionnaireService } from "../services/cv-questionnaire-service";
import { gamificationService } from "../services/gamification-service";
import { resumeService } from "../services/resume-service";
import { openapiDetail } from "../utils/openapi-detail";
import {
  type ResumeEnhanceRouteBody,
  type ResumeExportRouteBody,
  type ResumeIdParams,
  type ResumeMutationBody,
  type ResumeQuestionGenerateRouteBody,
  type ResumeQuestionSynthesizeRouteBody,
  type ResumeRouteSetState,
  type ResumeScoreRouteBody,
  resumeEnhanceBodySchema,
  resumeExportBodySchema,
  resumeIdParamsSchema,
  resumeMutationBodySchema,
  resumeQuestionGenerateBodySchema,
  resumeQuestionSynthesizeBodySchema,
  resumeScoreBodySchema,
} from "./resume-route-contracts";
import {
  resumeCreateResponses,
  resumeDeleteResponses,
  resumeEnhanceResponses,
  resumeEntityResponses,
  resumeExportResponses,
  resumeListResponses,
  resumeQuestionGenerateResponses,
  resumeQuestionSynthesizeResponses,
  resumeScoreResponses,
  resumeUpdateResponses,
} from "./resume-route-response-contracts";
import {
  buildResumeCreatePayload,
  buildResumeUpdatePayload,
  enhanceResumeWithAi,
  exportResumeAsset,
  handleResumeAiScore,
} from "./resume-route-support";

type RouteStatus = typeof status;

const toResumeEntityResponse = (resume: ResumeData) => ({
  id: resume.id ?? "",
  name: resume.name ?? RESUME_DEFAULT_NAME,
  personalInfo: resume.personalInfo,
  summary: resume.summary ?? "",
  experience: resume.experience ?? [],
  education: resume.education ?? [],
  skills: resume.skills,
  projects: resume.projects ?? [],
  gamingExperience: resume.gamingExperience,
  template: resume.template ?? RESUME_TEMPLATE_DEFAULT,
  theme: resume.theme ?? RESUME_DEFAULT_THEME,
  isDefault: resume.isDefault === true,
});

const toSimpleRouteErrorPayload = (payload: unknown, fallbackError: string) => {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = payload.error;
    const details = "details" in payload ? payload.details : undefined;
    if (typeof error === "string" && typeof details === "string") {
      return { error, details };
    }
    if (typeof error === "string") {
      return { error };
    }
  }
  return { error: fallbackError };
};

export const resumeRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.resumes),
})
  .post(
    toApiChildPath(API_ENDPOINTS.resumes, API_ENDPOINTS.resumeFromQuestionsGenerate),
    {
      detail: openapiDetail(
        "Resumes",
        "Retrieve resumes resource for BaoBuildBuddy career automation.",
      ),
      body: resumeQuestionGenerateBodySchema,
      response: resumeQuestionGenerateResponses,
    },
    async ({ body, status }: { body: ResumeQuestionGenerateRouteBody; status: RouteStatus }) => {
      const result = await settle(
        cvQuestionnaireService.generateQuestions({
          targetRole: body.targetRole,
          studioName: body.studioName,
          experienceLevel: body.experienceLevel,
        }),
      );
      if (result.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_GENERATE_QUESTIONS,
          details: result.reason instanceof Error ? result.reason.message : API_ERROR_UNKNOWN,
        });
      }
      return status(HTTP_STATUS_OK, { questions: result.value });
    },
  )
  .post(
    toApiChildPath(API_ENDPOINTS.resumes, API_ENDPOINTS.resumeFromQuestionsSynthesize),
    {
      detail: openapiDetail(
        "Resumes",
        "Retrieve resumes resource for BaoBuildBuddy career automation.",
      ),
      body: resumeQuestionSynthesizeBodySchema,
      response: resumeQuestionSynthesizeResponses,
    },
    async ({ body, status }: { body: ResumeQuestionSynthesizeRouteBody; status: RouteStatus }) => {
      const synthesizeResult = await settle(
        cvQuestionnaireService.synthesizeResume(body.questionsAndAnswers),
      );
      if (synthesizeResult.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            synthesizeResult.reason instanceof Error
              ? synthesizeResult.reason.message
              : API_ERROR_UNKNOWN,
        });
      }

      const createResult = await settle(
        resumeService.createResume({
          name: RESUME_DEFAULT_NAME_QUESTIONNAIRE,
          ...synthesizeResult.value,
        }),
      );
      if (createResult.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            createResult.reason instanceof Error ? createResult.reason.message : API_ERROR_UNKNOWN,
        });
      }

      return status(HTTP_STATUS_CREATED, toResumeEntityResponse(createResult.value));
    },
  )
  .get(
    "/",
    {
      detail: openapiDetail(
        "Resumes",
        "Retrieve resumes resource for BaoBuildBuddy career automation.",
      ),
      response: resumeListResponses,
    },
    async ({ status }: { status: RouteStatus }) =>
      status(HTTP_STATUS_OK, (await resumeService.getResumes()).map(toResumeEntityResponse)),
  )
  .post(
    "/",
    {
      detail: openapiDetail(
        "Resumes",
        "Create or execute resumes resource for BaoBuildBuddy career automation.",
      ),
      body: resumeMutationBodySchema,
      response: resumeCreateResponses,
    },
    async ({ body, status }: { body: ResumeMutationBody; status: RouteStatus }) => {
      const created = await resumeService.createResume(buildResumeCreatePayload(body));
      gamificationService.trackActionFireAndForget(
        "resumesGenerated",
        ROUTE_GAMIFICATION_XP.resumesGenerated,
        "resume_created",
      );
      return status(HTTP_STATUS_CREATED, toResumeEntityResponse(created));
    },
  )
  .get(
    "/:id",
    {
      detail: openapiDetail("Resumes", "Retrieve resumes :id for BaoBuildBuddy career automation."),
      params: resumeIdParamsSchema,
      response: resumeEntityResponses,
    },
    async ({ params, status }: { params: ResumeIdParams; status: RouteStatus }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_RESUME_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, toResumeEntityResponse(resume));
    },
  )
  .put(
    "/:id",
    {
      detail: openapiDetail("Resumes", "Replace resumes :id for BaoBuildBuddy career automation."),
      params: resumeIdParamsSchema,
      body: resumeMutationBodySchema,
      response: resumeUpdateResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: ResumeIdParams;
      body: ResumeMutationBody;
      status: RouteStatus;
    }) => {
      const updated = await resumeService.updateResume(params.id, buildResumeUpdatePayload(body));
      if (!updated) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_RESUME_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, toResumeEntityResponse(updated));
    },
  )
  .delete(
    "/:id",
    {
      detail: openapiDetail("Resumes", "Delete resumes :id for BaoBuildBuddy career automation."),
      params: resumeIdParamsSchema,
      response: resumeDeleteResponses,
    },
    async ({ params, status }: { params: ResumeIdParams; status: RouteStatus }) => {
      const existing = await resumeService.getResume(params.id);
      if (!existing) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_RESUME_NOT_FOUND });
      }
      await resumeService.deleteResume(params.id);
      return status(HTTP_STATUS_OK, { success: true, id: params.id });
    },
  )
  .post(
    "/:id/export",
    {
      detail: openapiDetail(
        "Resumes",
        "Create or execute resumes :id export for BaoBuildBuddy career automation.",
      ),
      params: resumeIdParamsSchema,
      body: resumeExportBodySchema,
      response: resumeExportResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: ResumeIdParams;
      body: ResumeExportRouteBody;
      status: RouteStatus;
    }) => {
      const state: ResumeRouteSetState = {};
      const result = await exportResumeAsset(params.id, body, state);
      if (state.status === HTTP_STATUS_NOT_FOUND) {
        return status(
          HTTP_STATUS_NOT_FOUND,
          toSimpleRouteErrorPayload(result, API_ERROR_RESUME_NOT_FOUND),
        );
      }
      if (state.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(
          HTTP_STATUS_INTERNAL_SERVER_ERROR,
          toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
        );
      }
      return status(HTTP_STATUS_OK, result);
    },
  )
  .post(
    "/:id/ai-enhance",
    {
      detail: openapiDetail(
        "Resumes",
        "Create or execute resumes :id ai enhance for BaoBuildBuddy career automation.",
      ),
      params: resumeIdParamsSchema,
      body: resumeEnhanceBodySchema,
      response: resumeEnhanceResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: ResumeIdParams;
      body: ResumeEnhanceRouteBody;
      status: RouteStatus;
    }) => {
      const state: ResumeRouteSetState = {};
      const result = await enhanceResumeWithAi(params.id, body, state);
      if (state.status === HTTP_STATUS_NOT_FOUND) {
        return status(
          HTTP_STATUS_NOT_FOUND,
          toSimpleRouteErrorPayload(result, API_ERROR_RESUME_NOT_FOUND),
        );
      }
      if (state.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(
          HTTP_STATUS_INTERNAL_SERVER_ERROR,
          toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
        );
      }
      if ("resume" in result && result.resume) {
        return status(HTTP_STATUS_OK, {
          resume: toResumeEntityResponse(result.resume),
          suggestions: result.suggestions,
          section: result.section,
        });
      }
      return status(
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
      );
    },
  )
  .post(
    "/:id/ai-score",
    {
      detail: openapiDetail(
        "Resumes",
        "Create or execute resumes :id ai score for BaoBuildBuddy career automation.",
      ),
      params: resumeIdParamsSchema,
      body: resumeScoreBodySchema,
      response: resumeScoreResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: ResumeIdParams;
      body: ResumeScoreRouteBody;
      status: RouteStatus;
    }) => {
      const state: ResumeRouteSetState = {};
      const result = await handleResumeAiScore(params.id, body, state);
      if (state.status === HTTP_STATUS_NOT_FOUND) {
        return status(
          HTTP_STATUS_NOT_FOUND,
          toSimpleRouteErrorPayload(result, API_ERROR_RESUME_NOT_FOUND),
        );
      }
      if (state.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(
          HTTP_STATUS_INTERNAL_SERVER_ERROR,
          toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
        );
      }
      if ("score" in result && typeof result.score === "number") {
        return status(HTTP_STATUS_OK, result);
      }
      return status(
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
      );
    },
  );
