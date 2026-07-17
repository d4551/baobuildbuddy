import { t, Elysia } from "elysia";
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
} from "@bao/shared/constants/http";
import { RESUME_DEFAULT_NAME_QUESTIONNAIRE } from "@bao/shared/constants/resume";
import { settle } from "@bao/shared/utils/promise";
import { cvQuestionnaireService } from "../services/cv-questionnaire-service";
import { gamificationService } from "../services/gamification-service";
import { resumeService } from "../services/resume-service";
import {
  type ResumeEnhanceRouteBody,
  type ResumeExportRouteBody,
  type ResumeIdParams,
  type ResumeMutationBody,
  type ResumeQuestionGenerateRouteBody,
  type ResumeQuestionSynthesizeRouteBody,
  type ResumeRouteSetState,
  type ResumeScoreBody,
  resumeEnhanceBodySchema,
  resumeExportBodySchema,
  resumeIdParamsSchema,
  resumeMutationBodySchema,
  resumeQuestionGenerateBodySchema,
  resumeQuestionSynthesizeBodySchema,
  resumeScoreBodySchema,
} from "./resume-route-contracts";
import {
  buildResumeCreatePayload,
  buildResumeUpdatePayload,
  enhanceResumeWithAi,
  exportResumeAsset,
  handleResumeAiScore,
} from "./resume-route-support";

export const resumeRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.resumes),
})
  .post(
    toApiChildPath(API_ENDPOINTS.resumes, API_ENDPOINTS.resumeFromQuestionsGenerate),
    { detail: { tags: ["Resumes"] }, body: resumeQuestionGenerateBodySchema,
    }, async ({ body, set }: { body: ResumeQuestionGenerateRouteBody; set: ResumeRouteSetState }) => {
      const result = await settle(
        cvQuestionnaireService.generateQuestions({
          targetRole: body.targetRole,
          studioName: body.studioName,
          experienceLevel: body.experienceLevel,
        }),
      );
      if (result.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_GENERATE_QUESTIONS,
          details: result.reason instanceof Error ? result.reason.message : API_ERROR_UNKNOWN,
        };
      }
      return { questions: result.value };
    },
  )
  .post(
    toApiChildPath(API_ENDPOINTS.resumes, API_ENDPOINTS.resumeFromQuestionsSynthesize),
    { detail: { tags: ["Resumes"] }, body: resumeQuestionSynthesizeBodySchema,
    }, async ({
      body,
      set,
    }: {
      body: ResumeQuestionSynthesizeRouteBody;
      set: ResumeRouteSetState;
    }) => {
      const synthesizeResult = await settle(
        cvQuestionnaireService.synthesizeResume(body.questionsAndAnswers),
      );
      if (synthesizeResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            synthesizeResult.reason instanceof Error
              ? synthesizeResult.reason.message
              : API_ERROR_UNKNOWN,
        };
      }

      const createResult = await settle(
        resumeService.createResume({
          name: RESUME_DEFAULT_NAME_QUESTIONNAIRE,
          ...synthesizeResult.value,
        }),
      );
      if (createResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            createResult.reason instanceof Error ? createResult.reason.message : API_ERROR_UNKNOWN,
        };
      }

      set.status = HTTP_STATUS_CREATED;
      return createResult.value;
    },
  )
  .get("/",{ detail: { tags: ["Resumes"] } }, async () => {
    return resumeService.getResumes();
  })
  .post(
    "/",
    { detail: { tags: ["Resumes"] }, body: resumeMutationBodySchema,
    }, async ({ body, set }: { body: ResumeMutationBody; set: ResumeRouteSetState }) => {
      const created = await resumeService.createResume(buildResumeCreatePayload(body));
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "resumesGenerated",
        ROUTE_GAMIFICATION_XP.resumesGenerated,
        "resume_created",
      );
      return created;
    },
  )
  .get(
    "/:id",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
    }, async ({ params, set }: { params: ResumeIdParams; set: ResumeRouteSetState }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return {
          error: API_ERROR_RESUME_NOT_FOUND,
        };
      }
      return resume;
    },
  )
  .put(
    "/:id",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
      body: resumeMutationBodySchema,
    }, async ({
      params,
      body,
      set,
    }: {
      params: ResumeIdParams;
      body: ResumeMutationBody;
      set: ResumeRouteSetState;
    }) => {
      const updated = await resumeService.updateResume(params.id, buildResumeUpdatePayload(body));
      if (!updated) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      return updated;
    },
  )
  .delete(
    "/:id",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
    }, async ({ params, set }: { params: ResumeIdParams; set: ResumeRouteSetState }) => {
      const existing = await resumeService.getResume(params.id);
      if (!existing) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      await resumeService.deleteResume(params.id);
      return { success: true, id: params.id };
    },
  )
  .post(
    "/:id/export",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
      body: resumeExportBodySchema,
    }, async ({
      params,
      body,
      set,
    }: {
      params: ResumeIdParams;
      body: ResumeExportRouteBody;
      set: ResumeRouteSetState;
    }) => exportResumeAsset(params.id, body, set),
  )
  .post(
    "/:id/ai-enhance",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
      body: resumeEnhanceBodySchema,
    }, async ({
      params,
      body,
      set,
    }: {
      params: ResumeIdParams;
      body: ResumeEnhanceRouteBody;
      set: ResumeRouteSetState;
    }) => enhanceResumeWithAi(params.id, body, set),
  )
  .post(
    "/:id/ai-score",
    { detail: { tags: ["Resumes"] }, params: resumeIdParamsSchema,
      body: resumeScoreBodySchema,
    }, async ({
      params,
      body,
      set,
    }: {
      params: ResumeIdParams;
      body: ResumeScoreBody;
      set: ResumeRouteSetState;
    }) => handleResumeAiScore(params.id, body, set),
  );
