import type {
  ApiEndpoint,
  ApiEndpointGroup,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiSpec,
} from "~/types/api-docs";
import { isRecord } from "@bao/shared/utils/type-guards";
import {
  getOperationParameters,
  getPathParameters,
  readOpenApiRequestBody,
  readOpenApiResponses,
} from "~/utils/api-docs-openapi";
import {
  API_DOCS_HTTP_METHODS_ORDER,
  isApiHttpMethod,
  normalizeApiDocsPathForId,
} from "~/utils/api-docs-status";

type ApiPayload = Parameters<typeof isRecord>[0];

const dedupeCaseInsensitiveStrings = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }
  return output;
};

const collectPathParameters = (path: string): string[] => {
  const names: string[] = [];
  const pattern = /\{([^}]+)\}/gu;
  for (const match of path.matchAll(pattern)) {
    const value = match[1];
    if (typeof value === "string" && value.trim().length > 0) {
      names.push(value.trim());
    }
  }
  return names;
};

const collectParameters = (
  parameters: readonly OpenApiParameter[],
  inValue: OpenApiParameter["in"],
): OpenApiParameter[] => {
  const filtered = parameters.filter((parameter) => parameter.in === inValue);
  const unique = new Map<string, OpenApiParameter>();
  for (const parameter of filtered) {
    const key = `${parameter.in}:${parameter.name.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, parameter);
    }
  }
  return Array.from(unique.values());
};

const getRequestBodyTemplate = (requestBody: OpenApiRequestBody | undefined): string => {
  const content = requestBody?.content;
  if (!content) {
    return "";
  }

  const jsonBody = content["application/json"];
  if (!(jsonBody && typeof jsonBody === "object")) {
    return "";
  }

  const firstExample =
    jsonBody.examples && typeof jsonBody.examples === "object"
      ? Object.values(jsonBody.examples)[0]
      : undefined;
  const candidate = jsonBody.example ?? firstExample?.value;
  return candidate === undefined ? "" : JSON.stringify(candidate, null, 2);
};

const readOpenApiOperation = (
  value: ApiPayload,
  pathParameters: readonly OpenApiParameter[],
): OpenApiOperation | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    operationId: typeof value.operationId === "string" ? value.operationId : undefined,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    deprecated: typeof value.deprecated === "boolean" ? value.deprecated : undefined,
    parameters: getOperationParameters(value, pathParameters),
    requestBody: readOpenApiRequestBody(value.requestBody),
    responses: readOpenApiResponses(value.responses),
  };
};

const collectEndpointsForPath = (
  path: string,
  pathItem: ApiPayload,
  unknownTagLabel: string,
): ApiEndpoint[] => {
  if (!isRecord(pathItem)) {
    return [];
  }

  const pathParameters = getPathParameters(pathItem);
  const pathParameterNames = dedupeCaseInsensitiveStrings(collectPathParameters(path));
  const endpoints: ApiEndpoint[] = [];

  for (const method of API_DOCS_HTTP_METHODS_ORDER) {
    const operation = readOpenApiOperation(pathItem[method], pathParameters);
    if (!(operation && isApiHttpMethod(method))) {
      continue;
    }

    const endpointTags = dedupeCaseInsensitiveStrings(operation.tags ?? []);
    const groupLabel = endpointTags[0] ?? unknownTagLabel;
    endpoints.push({
      id: `${groupLabel.toLowerCase().replace(/\s+/gu, "-")}-${method}-${normalizeApiDocsPathForId(path)}`,
      path,
      method,
      operation,
      groupLabel,
      pathParameters: pathParameterNames,
      queryParameters: collectParameters(operation.parameters ?? [], "query"),
      requestBodyTemplate: getRequestBodyTemplate(operation.requestBody),
      requestBodyRequired: Boolean(operation.requestBody?.required),
    });
  }

  return endpoints;
};

export const buildApiEndpointGroups = (
  spec: OpenApiSpec | null,
  unknownTagLabel: string,
): ApiEndpointGroup[] => {
  if (!spec?.paths) {
    return [];
  }

  const grouped = new Map<string, ApiEndpoint[]>();
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const endpoint of collectEndpointsForPath(path, pathItem, unknownTagLabel)) {
      const groupEndpoints = grouped.get(endpoint.groupLabel);
      if (groupEndpoints) {
        groupEndpoints.push(endpoint);
        continue;
      }

      grouped.set(endpoint.groupLabel, [endpoint]);
    }
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([label, endpoints]) => ({
      id: normalizeApiDocsPathForId(label),
      label,
      endpoints: endpoints.sort((left, right) => {
        const methodOrder =
          API_DOCS_HTTP_METHODS_ORDER.indexOf(left.method) -
          API_DOCS_HTTP_METHODS_ORDER.indexOf(right.method);
        return methodOrder !== 0 ? methodOrder : left.path.localeCompare(right.path);
      }),
    }));
};

export const resolveApiDocsPathWithParameters = (
  endpoint: ApiEndpoint,
  values: Record<string, string>,
): string | null => {
  let outputPath = endpoint.path;
  for (const name of endpoint.pathParameters) {
    const value = values[name]?.trim() ?? "";
    if (value.length === 0) {
      return null;
    }

    outputPath = outputPath.replace(`{${name}}`, encodeURIComponent(value));
  }
  return outputPath;
};

export const buildApiDocsQueryString = (
  queryParameters: readonly OpenApiParameter[],
  values: Record<string, string>,
): string => {
  const urlSearch = new URLSearchParams();
  for (const parameter of queryParameters) {
    const value = values[parameter.name]?.trim();
    if (!value) {
      continue;
    }
    urlSearch.append(parameter.name, value);
  }

  const serialized = urlSearch.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
};
