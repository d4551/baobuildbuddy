import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { StandardSchemaV1 } from "baobox";
import Type from "baobox";
import { Elysia } from "elysia";
import { searchService } from "../services/search-service";

const searchTypes = ["jobs", "studios", "skills", "resumes"] as const;
type SearchType = (typeof searchTypes)[number];
const searchTypeSchema = Type.Union(searchTypes.map((searchType) => Type.Literal(searchType)));

const parseSearchTypes = (value: string | string[] | undefined): SearchType[] | undefined => {
  if (!value) {
    return;
  }

  const rawTypes = typeof value === "string" ? value.split(",") : value;
  const parsedTypes = rawTypes
    .map((type) => type.trim())
    .filter((type): type is SearchType => (searchTypes as readonly string[]).includes(type));

  return parsedTypes.length > 0 ? parsedTypes : undefined;
};

export const searchRoutes = new Elysia({ prefix: "/search", tags: ["Search"] })
  .get(
    "/",
    ({ query }) => {
      const q = query.q || "";
      if (q.length < 2) {
        return {
          query: q,
          results: [],
          counts: { jobs: 0, studios: 0, skills: 0, resumes: 0 },
          totalTime: 0,
        };
      }
      const types = parseSearchTypes(query.types);
      return searchService.searchAll(q, types);
    },
    {
      query: StandardSchemaV1(
        Type.Object({
          q: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          types: Type.Optional(
            Type.Union([
              Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
              Type.Array(searchTypeSchema),
            ]),
          ),
        }),
      ),
    },
  )
  .get(
    "/autocomplete",
    async ({ query }) => {
      const prefix = query.prefix || "";
      return await searchService.autocomplete(prefix);
    },
    {
      query: StandardSchemaV1(
        Type.Object({
          prefix: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
        }),
      ),
    },
  );
