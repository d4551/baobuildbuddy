import type { ApiHttpMethod } from "~/types/api-docs";
import { HTTP_METHOD_CLASSES } from "~/composables/api-docs-page-contracts";

export const createApiDocsMethodPresentation = () => ({
  methodBadgeClass(method: ApiHttpMethod): string {
    return `badge badge-sm ${HTTP_METHOD_CLASSES[method]} font-semibold`;
  },
  methodLabel(method: ApiHttpMethod): string {
    return method.toUpperCase();
  },
});
