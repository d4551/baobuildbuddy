import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { DEFAULT_SEARCH_RESULT_TYPES } from "@bao/shared/constants/search";
import { Elysia } from "elysia";
import { searchService } from "../services/search-service";
import { openapiDetail } from "../utils/openapi-detail";
import {
  type SearchType,
  searchAllResponses,
  searchAutocompleteQuery,
  searchAutocompleteResponses,
  searchQuery,
  searchTypes,
} from "./search-route-contracts";

const searchTypeSet = new Set<string>(searchTypes);

const emptySearchCounts = (): Record<SearchType, number> => {
  const counts = {} as Record<SearchType, number>;
  for (const type of DEFAULT_SEARCH_RESULT_TYPES) {
    counts[type] = 0;
  }
  return counts;
};

const parseSearchTypes = (value: string | undefined): SearchType[] | undefined => {
  if (!value) {
    return;
  }

  const parsedTypes = value
    .split(",")
    .map((type) => type.trim())
    .filter((type): type is SearchType => searchTypeSet.has(type));

  return parsedTypes.length > 0 ? parsedTypes : undefined;
};

export const searchRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.searchBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.search),
    {
      detail: openapiDetail("Search", "Search jobs, studios, and related career content by query."),
      query: searchQuery,
      response: searchAllResponses,
    },
    async ({ query, status }) => {
      const q = query.q || "";
      if (q.length < 2) {
        return status(HTTP_STATUS_OK, {
          query: q,
          results: [],
          counts: emptySearchCounts(),
          totalTime: 0,
        });
      }
      const types = parseSearchTypes(query.types);
      return status(HTTP_STATUS_OK, await searchService.searchAll(q, types));
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.searchBase, API_ENDPOINTS.searchAutocomplete),
    {
      detail: openapiDetail(
        "Search",
        "Return autocomplete suggestions for a search prefix string.",
      ),
      query: searchAutocompleteQuery,
      response: searchAutocompleteResponses,
    },
    async ({ query, status }) => {
      const prefix = query.prefix || "";
      return status(HTTP_STATUS_OK, await searchService.autocomplete(prefix));
    },
  );
