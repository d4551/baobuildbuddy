import type { Static } from "typebox";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const searchTypes: readonly ["jobs", "studios", "skills", "resumes"] = [
  "jobs",
  "studios",
  "skills",
  "resumes",
];
export type SearchType = (typeof searchTypes)[number];

export const searchQuerySchema = t.Object({
  q: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  types: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export type SearchQuery = Static<typeof searchQuerySchema>;

export const searchAutocompleteQuerySchema = t.Object({
  prefix: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export type SearchAutocompleteQuery = Static<typeof searchAutocompleteQuerySchema>;

export const searchQuery = searchQuerySchema;
export const searchAutocompleteQuery = searchAutocompleteQuerySchema;

export const searchResultSchema = t.Object({
  type: t.Union([
    t.Literal("jobs"),
    t.Literal("studios"),
    t.Literal("skills"),
    t.Literal("resumes"),
  ]),
  id: t.String(),
  title: t.String(),
  subtitle: t.String(),
  snippet: t.String(),
  relevance: t.Number(),
});

export const searchAllResponseSchema = t.Object({
  query: t.String(),
  results: t.Array(searchResultSchema),
  counts: t.Object({
    jobs: t.Number(),
    studios: t.Number(),
    skills: t.Number(),
    resumes: t.Number(),
  }),
  totalTime: t.Number(),
});

export const searchAutocompleteResponseSchema = t.Array(
  t.Object({
    text: t.String(),
    type: t.String(),
  }),
);

export const searchAllResponses = {
  [HTTP_STATUS_OK]: searchAllResponseSchema,
};

export const searchAutocompleteResponses = {
  [HTTP_STATUS_OK]: searchAutocompleteResponseSchema,
};
