import { API_ERROR_COVER_LETTER_NOT_FOUND } from "@bao/shared";
import { Elysia } from "elysia";
import {
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

export const coverLetterRoutes = new Elysia({ prefix: "/cover-letters", tags: ["Cover Letters"] })
  .get("/", async () => listCoverLetters())
  .post(
    "/",
    async ({ body, set }) => {
      const result = await createCoverLetter(body);
      set.status = result.statusCode;
      return result.coverLetter;
    },
    { body: coverLetterMutationBodySchema },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const coverLetter = await getCoverLetterById(params.id, set);
      return coverLetter ?? { error: API_ERROR_COVER_LETTER_NOT_FOUND };
    },
    { params: coverLetterIdParamsSchema },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => updateCoverLetter(params.id, body, set),
    {
      params: coverLetterIdParamsSchema,
      body: coverLetterUpdateBodySchema,
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => deleteCoverLetter(params.id, set),
    { params: coverLetterIdParamsSchema },
  )
  .post("/generate", async ({ body, set }) => handleGenerateCoverLetter(body, set), {
    body: generateCoverLetterBodySchema,
  })
  .post(
    "/:id/export",
    async ({ params, body, set }) => exportCoverLetterAttachment(params.id, body.format, set),
    {
      params: coverLetterIdParamsSchema,
      body: coverLetterExportBodySchema,
    },
  );
