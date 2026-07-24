import type {
  OpenApiMediaType,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSpec,
} from "~/types/api-docs";
import { isRecord } from "@bao/shared/utils/type-guards";

type ApiPayload = Parameters<typeof isRecord>[0];

const isOpenApiParameterIn = (value: ApiPayload): value is OpenApiParameter["in"] =>
  value === "path" || value === "query" || value === "header" || value === "cookie";

const toOpenApiMediaExamples = (
  value: ApiPayload,
): Record<string, { value?: ApiPayload }> | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const output: Record<string, { value?: ApiPayload }> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      continue;
    }

    output[key] = entry.value !== undefined ? { value: entry.value } : {};
  }

  return Object.keys(output).length > 0 ? output : undefined;
};

const toOpenApiMediaType = (value: ApiPayload): OpenApiMediaType | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const parsed: OpenApiMediaType = {};
  if (value.example !== undefined) {
    parsed.example = value.example;
  }

  if (isRecord(value.schema)) {
    parsed.schema = value.schema;
  }

  const examples = toOpenApiMediaExamples(value.examples);
  if (examples) {
    parsed.examples = examples;
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
};

const toOpenApiMediaTypeMap = (value: ApiPayload): Record<string, OpenApiMediaType> | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const output: Record<string, OpenApiMediaType> = {};
  for (const [key, entry] of Object.entries(value)) {
    const parsed = toOpenApiMediaType(entry);
    if (parsed) {
      output[key] = parsed;
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
};

const toOpenApiRequestBody = (value: ApiPayload): OpenApiRequestBody | undefined => {
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

const toOpenApiResponses = (value: ApiPayload): Record<string, OpenApiResponse> | undefined => {
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

const toOpenApiPathMap = (value: ApiPayload): Record<string, Record<string, ApiPayload>> => {
  if (!isRecord(value)) {
    return {};
  }

  const output: Record<string, Record<string, ApiPayload>> = {};
  for (const [path, entry] of Object.entries(value)) {
    if (isRecord(entry)) {
      output[path] = entry;
    }
  }

  return output;
};

export const readOpenApiSpec = (value: ApiPayload): OpenApiSpec | null => {
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

export const getPathParameters = (pathItem: Record<string, ApiPayload>): OpenApiParameter[] => {
  const rawParameters: ApiPayload[] = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
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

export const getOperationParameters = (
  value: ApiPayload,
  pathParameters: readonly OpenApiParameter[],
): OpenApiParameter[] => {
  if (!isRecord(value)) {
    return [];
  }

  const parameters: ApiPayload[] = Array.isArray(value.parameters) ? value.parameters : [];
  const operationParameters = parameters.filter((parameter): parameter is OpenApiParameter => {
    if (!isRecord(parameter)) {
      return false;
    }

    if (typeof parameter.name !== "string") {
      return false;
    }

    return isOpenApiParameterIn(parameter.in);
  });

  return dedupeParameters([...pathParameters, ...operationParameters]);
};

export const readOpenApiRequestBody = (value: ApiPayload): OpenApiRequestBody | undefined =>
  toOpenApiRequestBody(value);

export const readOpenApiResponses = (
  value: ApiPayload,
): Record<string, OpenApiResponse> | undefined => toOpenApiResponses(value);
