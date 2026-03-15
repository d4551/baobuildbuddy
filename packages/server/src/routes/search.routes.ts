import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared";
import { Elysia, t } from "elysia";
import { searchService } from "../services/search-service";

const searchTypes = ["jobs", "studios", "skills", "resumes"] as const;
type SearchType = (typeof searchTypes)[number];

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
      const types = query.types
        ? query.types
            .split(",")
            .map((type) => type.trim())
            .filter((type): type is SearchType => (searchTypes as readonly string[]).includes(type))
        : undefined;
      return searchService.searchAll(q, types);
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        types: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      }),
    },
  )
  .get(
    "/autocomplete",
    ({ query }) => {
      const prefix = query.prefix || "";
      return searchService.autocomplete(prefix);
    },
    {
      query: t.Object({
        prefix: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      }),
    },
  );
