export type ApiHttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace";

export type ApiDocsUiState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "errorRetryable"
  | "errorNonRetryable"
  | "unauthorized";

export type ApiTesterState =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "errorRetryable"
  | "errorNonRetryable"
  | "unauthorized";

export interface OpenApiInfo {
  title?: string;
  description?: string;
  version?: string;
}

export interface OpenApiMediaType {
  example?: unknown;
  examples?: Record<string, { value?: unknown }>;
  schema?: Record<string, unknown>;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

/** Parsed from an OpenAPI JSON document, so it must stay assignable to `JsonValue`. */
export type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  example?: string;
};

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
}

export interface OpenApiSpec {
  openapi?: string;
  info?: OpenApiInfo;
  paths?: Record<string, Record<string, unknown>>;
}

export interface ApiEndpoint {
  readonly id: string;
  readonly path: string;
  readonly method: ApiHttpMethod;
  readonly operation: OpenApiOperation;
  readonly groupLabel: string;
  readonly pathParameters: readonly string[];
  readonly queryParameters: readonly OpenApiParameter[];
  readonly requestBodyTemplate: string;
  readonly requestBodyRequired: boolean;
}

export interface ApiEndpointGroup {
  readonly id: string;
  readonly label: string;
  readonly endpoints: readonly ApiEndpoint[];
}

export interface FetchEndpointResultOk {
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly durationMs: number;
  readonly url: string;
  readonly method: string;
}

export type FetchEndpointResult =
  | { readonly ok: true; readonly payload: FetchEndpointResultOk }
  | { readonly ok: false; readonly errorMessage: string };
