import type { ApiHttpMethod } from "~/types/api-docs";
import {
  BADGE_ACCENT_SM_CLASS,
  BADGE_ERROR_SM_CLASS,
  BADGE_INFO_SM_CLASS,
  BADGE_NEUTRAL_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
  BADGE_WARNING_SM_CLASS,
} from "~/constants/layout-badges";

export const API_DOCS_ASYNC_DATA_KEY = "api-docs-json";
export const UNKNOWN_TAG_LABEL_KEY = "apiDocs.groups.untagged";
export const API_TESTER_DIALOG_TITLE_ID = "api-endpoint-tester-title";
export const API_TESTER_DIALOG_DESCRIPTION_ID = "api-endpoint-tester-description";

/** Full badge class tokens per HTTP method (daisyUI semantic). */
export const HTTP_METHOD_CLASSES: Readonly<Record<ApiHttpMethod, string>> = {
  get: BADGE_SUCCESS_SM_CLASS,
  post: BADGE_INFO_SM_CLASS,
  put: BADGE_WARNING_SM_CLASS,
  patch: BADGE_ACCENT_SM_CLASS,
  delete: BADGE_ERROR_SM_CLASS,
  head: BADGE_NEUTRAL_SM_CLASS,
  options: BADGE_NEUTRAL_SM_CLASS,
  trace: BADGE_NEUTRAL_SM_CLASS,
};

export type ApiDocsTranslate = (key: string) => string;

export interface ApiDocsToast {
  readonly error: (message: string) => void;
  readonly info: (message: string) => void;
  readonly success: (message: string) => void;
}
