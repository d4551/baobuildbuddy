import { Elysia } from "elysia";
import { API_ERROR_COVER_LETTER_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import type { RouteSetState } from "../types/route-state";
import {
  type CoverLetterExportBody,
  type CoverLetterIdParams,
  type CoverLetterMutationBody,
  type CoverLetterUpdateBody,
  coverLetterDeleteResponses,
  coverLetterEntityResponses,
  coverLetterExportBodySchema,
  coverLetterExportResponses,
  coverLetterIdParamsSchema,
  coverLetterMutationBodySchema,
  coverLetterUpdateBodySchema,
  coverLettersListResponses,
  type GenerateCoverLetterRouteBody,
  generateCoverLetterResponses,
  generateCoverLetterBodySchema,
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

export const coverLetterRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.coverLettersBase),
})
  .get(
    "/",
    {
      detail: { tags: ["Cover Letters"] },
      },
    async () => listCoverLetters(),
  )
  .post(
    "/",
    {
      detail: { tags: ["Cover Letters"] },
      body: coverLetterMutationBodySchema,
      },
    async ({ body, set }: { body: CoverLetterMutationBody; set: RouteSetState }) => {
      const result = await createCoverLetter(body);
      set.status = result.statusCode;
      return result.coverLetter;
    },
  )
  .get(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      },
    async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) => {
      const coverLetter = await getCoverLetterById(params.id, set);
      return coverLetter ?? { error: API_ERROR_COVER_LETTER_NOT_FOUND };
    },
  )
  .put(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      body: coverLetterUpdateBodySchema,
      },
    async ({
      params,
      body,
      set,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterUpdateBody;
      set: RouteSetState;
    }) => updateCoverLetter(params.id, body, set),
  )
  .delete(
    "/:id",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      },
    async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) =>
      deleteCoverLetter(params.id, set),
  )
  .post(
    toApiChildPath(API_ENDPOINTS.coverLettersBase, API_ENDPOINTS.coverLettersGenerate),
    {
      detail: { tags: ["Cover Letters"] },
      body: generateCoverLetterBodySchema,
      },
    async ({ body, set }: { body: GenerateCoverLetterRouteBody; set: RouteSetState }) =>
      handleGenerateCoverLetter(body, set),
  )
  .post(
    "/:id/export",
    {
      detail: { tags: ["Cover Letters"] },
      params: coverLetterIdParamsSchema,
      body: coverLetterExportBodySchema,
      },
    async ({
      params,
      body,
      set,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterExportBody;
      set: RouteSetState;
    }) => exportCoverLetterAttachment(params.id, body.format, set),
  );
