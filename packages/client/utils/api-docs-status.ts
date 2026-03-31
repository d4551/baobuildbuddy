import type { ApiDocsUiState, ApiHttpMethod } from "~/types/api-docs";

export const API_DOCS_HTTP_METHODS_ORDER = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const satisfies readonly ApiHttpMethod[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isApiHttpMethod = (value: string): value is ApiHttpMethod =>
  API_DOCS_HTTP_METHODS_ORDER.some((method) => method === value);

export const toErrorStatusCode = (error: unknown): number | null => {
  if (!isRecord(error)) {
    return null;
  }

  const status = error.status;
  if (typeof status === "number") {
    return status;
  }

  const statusCode = error.statusCode;
  return typeof statusCode === "number" ? statusCode : null;
};

export const toApiDocsUiStateFromStatusCode = (statusCode: number | null): ApiDocsUiState => {
  if (statusCode === 401) {
    return "unauthorized";
  }

  if (statusCode === null || statusCode >= 500 || statusCode === 429) {
    return "errorRetryable";
  }

  return "errorNonRetryable";
};

export const normalizeApiDocsPathForId = (path: string): string =>
  path
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/(^-|-$)/gu, "") || "root";

export const getApiDocsParameterValueDefault = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};
