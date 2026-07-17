import { Elysia, type status } from "elysia";
import {
  API_ERROR_COVER_LETTER_NOT_FOUND,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@bao/shared/constants/http";
import type { RouteSetState } from "../types/route-state";
import {
  type CoverLetterExportBody,
  type CoverLetterIdParams,
  type GenerateCoverLetterRouteBody,
  coverLetterExportBodySchema,
  coverLetterExportResponses,
  coverLetterDeleteResponses,
  coverLetterEntityResponses,
  coverLetterIdParamsSchema,
  coverLettersListResponses,
  coverLetterMutationBodySchema,
  coverLetterUpdateBodySchema,
  generateCoverLetterBodySchema,
  generateCoverLetterResponses,
} from "./cover-letter-route-contracts";
import {
  exportCoverLetterAttachment,
  handleGenerateCoverLetter,
} from "./cover-letter-route-generation";
import {
  createCoverLetter,
  deleteCoverLetter,
  getCoverLetterById,
  listCoverLetters,
  updateCoverLetter,
} from "./cover-letter-route-support";

type RouteStatus = typeof status;

type CoverLetterEntitySource = {
  id: string;
  company: string;
  position: string;
  jobInfo?: unknown;
  content?: unknown;
  template?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const toRecordOrNull = (value: unknown) => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return { ...value };
  }
  return null;
};

const toCoverLetterEntityResponse = (letter: CoverLetterEntitySource) => ({
  id: letter.id,
  company: letter.company,
  position: letter.position,
  jobInfo: toRecordOrNull(letter.jobInfo),
  content: toRecordOrNull(letter.content),
  template: letter.template,
  createdAt: letter.createdAt,
  updatedAt: letter.updatedAt,
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

export const coverLetterRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.coverLettersBase),
})
  .get(
    "/",
    {
      detail: { tags: ["Cover Letters"] },
      response: coverLettersListResponses,
    },
    async ({ status }) =>
      status(HTTP_STATUS_OK, (await listCoverLetters()).map(toCoverLetterEntityResponse)),
  )
  .post(
    "/",
    {
      detail: { tags: ["Cover Letters"] },
      body: coverLetterMutationBodySchema,
      response: coverLetterEntityResponses,
    },
    async ({ body, status }) => {
      const result = await createCoverLetter(body);
      return status(HTTP_STATUS_CREATED, toCoverLetterEntityResponse(result.coverLetter));
    },
  )
  .get(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      response: coverLetterEntityResponses,
    },
    async ({ params, status }) => {
      const state: RouteSetState = {};
      const coverLetter = await getCoverLetterById(params.id, state);
      if (!coverLetter) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_COVER_LETTER_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, toCoverLetterEntityResponse(coverLetter));
    },
  )
  .put(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      body: coverLetterUpdateBodySchema,
      response: coverLetterEntityResponses,
    },
    async ({ params, body, status }) => {
      const state: RouteSetState = {};
      const result = await updateCoverLetter(params.id, body, state);
      if (!("id" in result) || state.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_COVER_LETTER_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, toCoverLetterEntityResponse(result));
    },
  )
  .delete(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      response: coverLetterDeleteResponses,
    },
    async ({ params, status }: { params: CoverLetterIdParams; status: RouteStatus }) => {
      const state: RouteSetState = {};
      await deleteCoverLetter(params.id, state);
      if (state.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_COVER_LETTER_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, { success: true, id: params.id });
    },
  )
  .post(
    toApiChildPath(API_ENDPOINTS.coverLettersBase, API_ENDPOINTS.coverLettersGenerate),
    {
      detail: { tags: ["Cover Letters"] },
      body: generateCoverLetterBodySchema,
      response: generateCoverLetterResponses,
    },
    async ({ body, status }: { body: GenerateCoverLetterRouteBody; status: RouteStatus }) => {
      const state: RouteSetState = {};
      const result = await handleGenerateCoverLetter(body, state);
      if (state.status === HTTP_STATUS_SERVICE_UNAVAILABLE) {
        return status(
          HTTP_STATUS_SERVICE_UNAVAILABLE,
          toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
        );
      }
      if (state.status === HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        return status(
          HTTP_STATUS_INTERNAL_SERVER_ERROR,
          toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
        );
      }
      if (state.status === HTTP_STATUS_CREATED && "coverLetter" in result && result.coverLetter) {
        return status(HTTP_STATUS_CREATED, {
          message: result.message,
          coverLetter: toCoverLetterEntityResponse(result.coverLetter),
        });
      }
      if ("content" in result && result.content) {
        return status(HTTP_STATUS_OK, {
          message: result.message,
          content: result.content,
        });
      }
      return status(
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        toSimpleRouteErrorPayload(result, API_ERROR_UNKNOWN),
      );
    },
  )
  .post(
    "/:id/export",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      body: coverLetterExportBodySchema,
      response: coverLetterExportResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterExportBody;
      status: RouteStatus;
    }) => {
      const state: RouteSetState = {};
      const result = await exportCoverLetterAttachment(params.id, body.format, state);
      if (state.status === HTTP_STATUS_NOT_FOUND) {
        return status(
          HTTP_STATUS_NOT_FOUND,
          toSimpleRouteErrorPayload(result, API_ERROR_COVER_LETTER_NOT_FOUND),
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
  );
