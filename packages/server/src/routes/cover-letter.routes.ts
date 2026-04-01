import { API_ERROR_COVER_LETTER_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import {
  type CoverLetterExportBody,
  type CoverLetterIdParams,
  type CoverLetterMutationBody,
  type CoverLetterUpdateBody,
  type GenerateCoverLetterRouteBody,
  type RouteSetState,
  coverLetterExportBodySchema,
  coverLetterIdParamsSchema,
  coverLetterMutationBodySchema,
  coverLetterUpdateBodySchema,
  generateCoverLetterBodySchema,
} from "./cover-letter-route-contracts";
import {
  createCoverLetter,
  deleteCoverLetter,
  getCoverLetterById,
  listCoverLetters,
  updateCoverLetter,
} from "./cover-letter-route-support";
import {
  exportCoverLetterAttachment,
  handleGenerateCoverLetter,
} from "./cover-letter-route-generation";

export const coverLetterRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.coverLettersBase),
  tags: ["Cover Letters"],
})
  .get("/", async () => listCoverLetters())
  .post(
    "/",
    async ({ body, set }: { body: CoverLetterMutationBody; set: RouteSetState }) => {
      const result = await createCoverLetter(body);
      set.status = result.statusCode;
      return result.coverLetter;
    },
    { body: StandardSchemaV1(coverLetterMutationBodySchema) },
  )
  .get(
    "/:id",
    async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) => {
      const coverLetter = await getCoverLetterById(params.id, set);
      return coverLetter ?? { error: API_ERROR_COVER_LETTER_NOT_FOUND };
    },
    { params: StandardSchemaV1(coverLetterIdParamsSchema) },
  )
  .put(
    "/:id",
    async ({
      params,
      body,
      set,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterUpdateBody;
      set: RouteSetState;
    }) => updateCoverLetter(params.id, body, set),
    {
      params: StandardSchemaV1(coverLetterIdParamsSchema),
      body: StandardSchemaV1(coverLetterUpdateBodySchema),
    },
  )
  .delete("/:id", async ({ params, set }: { params: CoverLetterIdParams; set: RouteSetState }) =>
    deleteCoverLetter(params.id, set), {
    params: StandardSchemaV1(coverLetterIdParamsSchema),
  })
  .post(
    toApiChildPath(API_ENDPOINTS.coverLettersBase, API_ENDPOINTS.coverLettersGenerate),
    async ({ body, set }: { body: GenerateCoverLetterRouteBody; set: RouteSetState }) =>
      handleGenerateCoverLetter(body, set),
    {
      body: StandardSchemaV1(generateCoverLetterBodySchema),
    },
  )
  .post(
    "/:id/export",
    async ({
      params,
      body,
      set,
    }: {
      params: CoverLetterIdParams;
      body: CoverLetterExportBody;
      set: RouteSetState;
    }) => exportCoverLetterAttachment(params.id, body.format, set),
    {
      params: StandardSchemaV1(coverLetterIdParamsSchema),
      body: StandardSchemaV1(coverLetterExportBodySchema),
    },
  );
