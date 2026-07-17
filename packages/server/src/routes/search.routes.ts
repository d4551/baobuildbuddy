import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { Elysia } from "elysia";
import { searchService } from "../services/search-service";
import {
  type SearchAutocompleteQuery,
  type SearchQuery,
  type SearchType,
  searchAutocompleteQuery,
  searchQuery,
  searchTypes,
} from "./search-route-contracts";

const parseSearchTypes = (value: string | undefined): SearchType[] | undefined => {
  if (!value) {
    return;
  }

  const parsedTypes = value
    .split(",")
    .map((type) => type.trim())
    .filter((type): type is SearchType => (searchTypes as readonly string[]).includes(type));

  return parsedTypes.length > 0 ? parsedTypes : undefined;
};

export const searchRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.searchBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.search),
    { detail: { tags: ["Search"] }, query: searchQuery,
    }, ({ query }: { query: SearchQuery }) => {
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
  )
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.searchAutocomplete),
    { detail: { tags: ["Search"] }, query: searchAutocompleteQuery,
    }, async ({ query }: { query: SearchAutocompleteQuery }) => {
      const prefix = query.prefix || "";
      return await searchService.autocomplete(prefix);
    },
  );
