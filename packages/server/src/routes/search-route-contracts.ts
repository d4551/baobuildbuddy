import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";

export const searchTypes = ["jobs", "studios", "skills", "resumes"] as const;
export type SearchType = (typeof searchTypes)[number];

const searchTypeSchema = Type.Union(searchTypes.map((searchType) => Type.Literal(searchType)));

export const searchQuerySchema = Type.Object({
  q: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  types: Type.Optional(
    Type.Union([Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), Type.Array(searchTypeSchema)]),
  ),
});

export type SearchQuery = StaticParse<typeof searchQuerySchema>;

export const searchAutocompleteQuerySchema = Type.Object({
  prefix: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export type SearchAutocompleteQuery = StaticParse<typeof searchAutocompleteQuerySchema>;

export const searchQuery = StandardSchemaV1(searchQuerySchema);
export const searchAutocompleteQuery = StandardSchemaV1(searchAutocompleteQuerySchema);
