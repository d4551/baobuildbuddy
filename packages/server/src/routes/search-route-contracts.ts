import type { Static } from "typebox";
import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const searchTypes = ["jobs", "studios", "skills", "resumes"] as const;
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
