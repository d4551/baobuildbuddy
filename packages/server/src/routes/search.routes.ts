import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
import { searchService } from "../services/search-service";
import {
  type SearchType,
  searchAllResponses,
  searchAutocompleteQuery,
  searchAutocompleteResponses,
  searchQuery,
  searchTypes,
} from "./search-route-contracts";

const searchTypeSet = new Set<string>(searchTypes);

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
      detail: { tags: ["Search"] },
      query: searchQuery,
      response: searchAllResponses,
    },
    async ({ query, status }) => {
      const q = query.q || "";
      if (q.length < 2) {
        return status(HTTP_STATUS_OK, {
          query: q,
          results: [],
          counts: { jobs: 0, studios: 0, skills: 0, resumes: 0 },
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
      detail: { tags: ["Search"] },
      query: searchAutocompleteQuery,
      response: searchAutocompleteResponses,
    },
    async ({ query, status }) => {
      const prefix = query.prefix || "";
      return status(HTTP_STATUS_OK, await searchService.autocomplete(prefix));
    },
  );
