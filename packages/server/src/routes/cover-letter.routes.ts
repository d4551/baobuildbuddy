import { API_ERROR_COVER_LETTER_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import type { RouteSetState } from "../types/route-state";
import {
  type CoverLetterExportBody,
  type CoverLetterIdParams,
  type CoverLetterMutationBody,
  type CoverLetterUpdateBody,
  coverLetterExportBodySchema,
  coverLetterIdParamsSchema,
  coverLetterMutationBodySchema,
  coverLetterUpdateBodySchema,
  type GenerateCoverLetterRouteBody,
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
  tags: ["Cover Letters"],
})
  .get("/", async () => listCoverLetters())
  .post(
    "/",
    { body: StandardSchemaV1(coverLetterMutationBodySchema) }, async ({ body, set }: { body: CoverLetterMutationBody; set: RouteSetState }) => {
      const result = await createCoverLetter(body);
      set.status = result.statusCode;
      return result.coverLetter;
    },
  )
  .get(
    "/:id",
    { params: StandardSchemaV1(coverLetterIdParamsSchema) }, async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) => {
      const coverLetter = await getCoverLetterById(params.id, set);
      return coverLetter ?? { error: API_ERROR_COVER_LETTER_NOT_FOUND };
    },
  )
  .put(
    "/:id",
    {
      params: StandardSchemaV1(coverLetterIdParamsSchema),
      body: StandardSchemaV1(coverLetterUpdateBodySchema),
    }, async ({
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
      params: StandardSchemaV1(coverLetterIdParamsSchema),
    }, async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) =>
      deleteCoverLetter(params.id, set),
  )
  .post(
    toApiChildPath(API_ENDPOINTS.coverLettersBase, API_ENDPOINTS.coverLettersGenerate),
    {
      body: StandardSchemaV1(generateCoverLetterBodySchema),
    }, async ({ body, set }: { body: GenerateCoverLetterRouteBody; set: RouteSetState }) =>
      handleGenerateCoverLetter(body, set),
  )
  .post(
    "/:id/export",
    {
      params: StandardSchemaV1(coverLetterIdParamsSchema),
      body: StandardSchemaV1(coverLetterExportBodySchema),
    }, async ({
      params,
      body,
      set,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterExportBody;
      set: RouteSetState;
    }) => exportCoverLetterAttachment(params.id, body.format, set),
  );
