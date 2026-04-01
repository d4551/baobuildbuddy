import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { Elysia } from "elysia";
import { searchService } from "../services/search-service";
import {
  searchAutocompleteQuery,
  type SearchAutocompleteQuery,
  searchQuery,
  type SearchQuery,
  searchTypes,
  type SearchType,
} from "./search-route-contracts";

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

export const searchRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.searchBase),
  tags: ["Search"],
})
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.search),
    ({ query }: { query: SearchQuery }) => {
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
      query: searchQuery,
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.searchAutocomplete),
    async ({ query }: { query: SearchAutocompleteQuery }) => {
      const prefix = query.prefix || "";
      return await searchService.autocomplete(prefix);
    },
    {
      query: searchAutocompleteQuery,
    },
  );
