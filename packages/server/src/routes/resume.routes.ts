import {
  API_ERROR_GENERATE_QUESTIONS,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_SYNTHESIZE_RESUME,
  API_ERROR_UNKNOWN,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  RESUME_DEFAULT_NAME_QUESTIONNAIRE,
  ROUTE_GAMIFICATION_XP,
  settle,
} from "@bao/shared";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { cvQuestionnaireService } from "../services/cv-questionnaire-service";
import { gamificationService } from "../services/gamification-service";
import { resumeService } from "../services/resume-service";
import {
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

export const resumeRoutes = new Elysia({ prefix: "/resumes", tags: ["Resumes"] })
  .post(
    "/from-questions/generate",
    async ({ body, set }) => {
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
    {
      body: StandardSchemaV1(resumeQuestionGenerateBodySchema),
    },
  )
  .post(
    "/from-questions/synthesize",
    async ({ body, set }) => {
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
    {
      body: StandardSchemaV1(resumeQuestionSynthesizeBodySchema),
    },
  )
  .get("/", async () => {
    return resumeService.getResumes();
  })
  .post(
    "/",
    async ({ body, set }) => {
      const created = await resumeService.createResume(buildResumeCreatePayload(body));
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "resumesGenerated",
        ROUTE_GAMIFICATION_XP.resumesGenerated,
        "resume_created",
      );
      return created;
    },
    {
      body: StandardSchemaV1(resumeMutationBodySchema),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return {
          error: API_ERROR_RESUME_NOT_FOUND,
        };
      }
      return resume;
    },
    {
      params: StandardSchemaV1(resumeIdParamsSchema),
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const updated = await resumeService.updateResume(params.id, buildResumeUpdatePayload(body));
      if (!updated) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      return updated;
    },
    {
      params: StandardSchemaV1(resumeIdParamsSchema),
      body: StandardSchemaV1(resumeMutationBodySchema),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await resumeService.getResume(params.id);
      if (!existing) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      await resumeService.deleteResume(params.id);
      return { success: true, id: params.id };
    },
    {
      params: StandardSchemaV1(resumeIdParamsSchema),
    },
  )
  .post("/:id/export", async ({ params, body, set }) => exportResumeAsset(params.id, body, set), {
    params: StandardSchemaV1(resumeIdParamsSchema),
    body: StandardSchemaV1(resumeExportBodySchema),
  })
  .post(
    "/:id/ai-enhance",
    async ({ params, body, set }) => enhanceResumeWithAi(params.id, body, set),
    {
      params: StandardSchemaV1(resumeIdParamsSchema),
      body: StandardSchemaV1(resumeEnhanceBodySchema),
    },
  )
  .post(
    "/:id/ai-score",
    async ({ params, body, set }) => handleResumeAiScore(params.id, body, set),
    {
      params: StandardSchemaV1(resumeIdParamsSchema),
      body: StandardSchemaV1(resumeScoreBodySchema),
    },
  );
