import type { ApiDocsUiState, ApiHttpMethod } from "~/types/api-docs";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
} from "@bao/shared/constants/http";
import { isRecord } from "@bao/shared/utils/type-guards";

type ApiPayload = Parameters<typeof isRecord>[0];

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

export const isApiHttpMethod = (value: string): value is ApiHttpMethod =>
  API_DOCS_HTTP_METHODS_ORDER.some((method) => method === value);

export const toErrorStatusCode = (error: ApiPayload): number | null => {
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
  if (statusCode === HTTP_STATUS_UNAUTHORIZED) {
    return "unauthorized";
  }

  if (
    statusCode === null ||
    statusCode >= HTTP_STATUS_INTERNAL_SERVER_ERROR ||
    statusCode === HTTP_STATUS_TOO_MANY_REQUESTS
  ) {
    return "errorRetryable";
  }

  return "errorNonRetryable";
};

export const normalizeApiDocsPathForId = (path: string): string =>
  path
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/(^-|-$)/gu, "") || "root";

export const getApiDocsParameterValueDefault = (value: ApiPayload): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};
