import type { ApiHttpMethod } from "~/types/api-docs";

export const API_DOCS_ASYNC_DATA_KEY = "api-docs-json";
export const UNKNOWN_TAG_LABEL_KEY = "apiDocs.groups.untagged";
export const API_TESTER_DIALOG_TITLE_ID = "api-endpoint-tester-title";
export const API_TESTER_DIALOG_DESCRIPTION_ID = "api-endpoint-tester-description";

export const HTTP_METHOD_CLASSES: Readonly<Record<ApiHttpMethod, string>> = {
  get: "badge-success",
  post: "badge-info",
  put: "badge-warning",
  patch: "badge-accent",
  delete: "badge-error",
  head: "badge-neutral",
  options: "badge-neutral",
  trace: "badge-neutral",
};

export type ApiDocsTranslate = (key: string) => string;

export interface ApiDocsToast {
  readonly error: (message: string) => void;
  readonly info: (message: string) => void;
  readonly success: (message: string) => void;
}
