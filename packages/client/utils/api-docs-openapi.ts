import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import type {
  OpenApiMediaType,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSpec,
} from "~/types/api-docs";

const isOpenApiParameterIn = (value: unknown): value is OpenApiParameter["in"] =>
  value === "path" || value === "query" || value === "header" || value === "cookie";

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

const toOpenApiMediaTypeMap = (value: unknown): Record<string, OpenApiMediaType> | undefined => {
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

/** Single owner for "is this payload entry a usable OpenAPI parameter". */
const isOpenApiParameter = (parameter: JsonValue): parameter is OpenApiParameter =>
  isRecord(parameter) && typeof parameter.name === "string" && isOpenApiParameterIn(parameter.in);

/** Reads a `parameters` array off an OpenAPI node without widening it to `any`. */
const readParameterEntries = (source: JsonValue | undefined): OpenApiParameter[] =>
  (asJsonArray(source) ?? []).filter(isOpenApiParameter);

export const getPathParameters = (pathItem: JsonObject): OpenApiParameter[] => {
  const normalized = readParameterEntries(pathItem.parameters).map((parameter) => ({
    ...parameter,
    name: parameter.name.trim(),
  }));

  return dedupeParameters(normalized);
};

export const getOperationParameters = (
  value: unknown,
  pathParameters: readonly OpenApiParameter[],
): OpenApiParameter[] => {
  if (!isRecord(value)) {
    return [];
  }

  return dedupeParameters([...pathParameters, ...readParameterEntries(value.parameters)]);
};

export const readOpenApiRequestBody = (value: unknown): OpenApiRequestBody | undefined =>
  toOpenApiRequestBody(value);

export const readOpenApiResponses = (value: unknown): Record<string, OpenApiResponse> | undefined =>
  toOpenApiResponses(value);
