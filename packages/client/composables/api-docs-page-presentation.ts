import { HTTP_METHOD_CLASSES } from "~/composables/api-docs-page-contracts";
import type { ApiHttpMethod } from "~/types/api-docs";

export const createApiDocsMethodPresentation = () => ({
  methodBadgeClass(method: ApiHttpMethod): string {
    return `${HTTP_METHOD_CLASSES[method]} font-semibold`;
  },
  methodLabel(method: ApiHttpMethod): string {
    return method.toUpperCase();
  },
});
