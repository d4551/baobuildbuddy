import type {
  ApiDocsUiState,
  ApiEndpoint,
  ApiEndpointGroup,
  ApiHttpMethod,
  OpenApiMediaType,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSpec,
} from "~/types/api-docs";

export const API_DOCS_HTTP_METHODS_ORDER = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOpenApiParameterIn = (value: unknown): value is OpenApiParameter["in"] =>
  value === "path" || value === "query" || value === "header" || value === "cookie";

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

const toOpenApiMediaExamples = (
  value: unknown,
): Record<string, { value?: unknown }> | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const output: Record<string, { value?: unknown }> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      continue;
    }

    output[key] = entry.value !== undefined ? { value: entry.value } : {};
  }

  return Object.keys(output).length > 0 ? output : undefined;
};

const toOpenApiMediaType = (value: unknown): OpenApiMediaType | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const mediaType: OpenApiMediaType = {};
  if (value.example !== undefined) {
    mediaType.example = value.example;
  }

  if (isRecord(value.schema)) {
    mediaType.schema = value.schema;
  }

  const examples = toOpenApiMediaExamples(value.examples);
  if (examples) {
    mediaType.examples = examples;
  }

  return Object.keys(mediaType).length > 0 ? mediaType : undefined;
};

const toOpenApiMediaTypeMap = (
  value: unknown,
): Record<string, OpenApiMediaType> | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const output: Record<string, OpenApiMediaType> = {};
  for (const [key, entry] of Object.entries(value)) {
    const mediaType = toOpenApiMediaType(entry);
    if (mediaType) {
      output[key] = mediaType;
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
};

const toOpenApiRequestBody = (value: unknown): OpenApiRequestBody | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const requestBody: OpenApiRequestBody = {
    required: typeof value.required === "boolean" ? value.required : undefined,
  };
  const content = toOpenApiMediaTypeMap(value.content);
  if (content) {
    requestBody.content = content;
  }

  return requestBody.required !== undefined || requestBody.content ? requestBody : undefined;
};

const toOpenApiResponses = (value: unknown): Record<string, OpenApiResponse> | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const output: Record<string, OpenApiResponse> = {};
  for (const [statusCode, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      continue;
    }

    const response: OpenApiResponse = {
      description: typeof entry.description === "string" ? entry.description : undefined,
    };
    const content = toOpenApiMediaTypeMap(entry.content);
    if (content) {
      response.content = content;
    }
    output[statusCode] = response;
  }

  return Object.keys(output).length > 0 ? output : undefined;
};

const toOpenApiPathMap = (value: unknown): Record<string, Record<string, unknown>> => {
  if (!isRecord(value)) {
    return {};
  }

  const output: Record<string, Record<string, unknown>> = {};
  for (const [path, entry] of Object.entries(value)) {
    if (isRecord(entry)) {
      output[path] = entry;
    }
  }

  return output;
};

export const readOpenApiSpec = (value: unknown): OpenApiSpec | null => {
  if (!isRecord(value)) {
    return null;
  }

  const infoRaw = isRecord(value.info) ? value.info : undefined;
  return {
    openapi: typeof value.openapi === "string" ? value.openapi : undefined,
    info: {
      title: typeof infoRaw?.title === "string" ? infoRaw.title : undefined,
      description: typeof infoRaw?.description === "string" ? infoRaw.description : undefined,
      version: typeof infoRaw?.version === "string" ? infoRaw.version : undefined,
    },
    paths: toOpenApiPathMap(value.paths),
  };
};

const dedupeParameters = (parameters: readonly OpenApiParameter[]): OpenApiParameter[] => {
  const unique = new Map<string, OpenApiParameter>();
  for (const parameter of parameters) {
    const key = `${parameter.in}:${parameter.name.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, {
        ...parameter,
        name: parameter.name.trim(),
      });
    }
  }

  return Array.from(unique.values()).filter((parameter) => parameter.name.length > 0);
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

const getPathParameters = (pathItem: Record<string, unknown>): OpenApiParameter[] => {
  const rawParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  const normalized = rawParameters
    .filter((parameter): parameter is OpenApiParameter => {
      if (!isRecord(parameter)) {
        return false;
      }

      if (typeof parameter.name !== "string") {
        return false;
      }

      return isOpenApiParameterIn(parameter.in);
    })
    .map((parameter) => ({
      ...parameter,
      name: parameter.name.trim(),
    }));

  return dedupeParameters(normalized);
};

const getOperation = (
  value: unknown,
  pathParameters: readonly OpenApiParameter[],
): OpenApiOperation | null => {
  if (!isRecord(value)) {
    return null;
  }

  const parameters = Array.isArray(value.parameters) ? value.parameters : [];
  const operationParameters = parameters.filter((parameter): parameter is OpenApiParameter => {
    if (!isRecord(parameter)) {
      return false;
    }

    if (typeof parameter.name !== "string") {
      return false;
    }

    return isOpenApiParameterIn(parameter.in);
  });

  const mergedParameters = dedupeParameters([...pathParameters, ...operationParameters]);
  return {
    operationId: typeof value.operationId === "string" ? value.operationId : undefined,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    deprecated: typeof value.deprecated === "boolean" ? value.deprecated : undefined,
    parameters: mergedParameters,
    requestBody: toOpenApiRequestBody(value.requestBody),
    responses: toOpenApiResponses(value.responses),
  };
};

const collectParameters = (
  parameters: readonly OpenApiParameter[],
  inValue: OpenApiParameter["in"],
): OpenApiParameter[] =>
  dedupeParameters(parameters.filter((parameter) => parameter.in === inValue));

export const getApiDocsParameterValueDefault = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
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

const collectEndpointsForPath = (
  path: string,
  pathItem: unknown,
  unknownTagLabel: string,
): ApiEndpoint[] => {
  if (!isRecord(pathItem)) {
    return [];
  }

  const pathParameters = getPathParameters(pathItem);
  const pathParameterNames = dedupeCaseInsensitiveStrings(collectPathParameters(path));
  const endpoints: ApiEndpoint[] = [];

  for (const method of API_DOCS_HTTP_METHODS_ORDER) {
    const operation = getOperation(pathItem[method], pathParameters);
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
