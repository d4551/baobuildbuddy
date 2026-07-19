import { safeParseJson } from "@bao/shared/utils/json";
import type { ApiDocsTranslate } from "~/composables/api-docs-page-contracts";
import { requestResolvedApiRaw, toClientApiHttpMethod } from "~/composables/api-request";
import type { ApiEndpoint, FetchEndpointResult, FetchEndpointResultOk } from "~/types/api-docs";
import {
  buildApiDocsQueryString,
  resolveApiDocsPathWithParameters,
} from "~/utils/api-docs-endpoints";
import { getApiDocsParameterValueDefault } from "~/utils/api-docs-status";
import { resolveApiEndpoint } from "~/utils/endpoints";

export type ApiDocsTesterInitialValues = {
  readonly initialPathValues: Record<string, string>;
  readonly initialQueryValues: Record<string, string>;
  readonly requestBodyValue: string;
};

export function createInitialTesterValues(endpoint: ApiEndpoint): ApiDocsTesterInitialValues {
  const initialPathValues: Record<string, string> = {};
  for (const name of endpoint.pathParameters) {
    initialPathValues[name] = "";
  }

  const initialQueryValues: Record<string, string> = {};
  for (const parameter of endpoint.queryParameters) {
    initialQueryValues[parameter.name] = getApiDocsParameterValueDefault(parameter.example);
  }

  return {
    initialPathValues,
    initialQueryValues,
    requestBodyValue: endpoint.requestBodyTemplate,
  };
}

type ApiDocsEndpointRequestError = {
  readonly ok: false;
  readonly state: "errorNonRetryable";
  readonly message: string;
};

type ApiDocsEndpointRequestOk = {
  readonly ok: true;
  readonly endpointUrl: string;
  readonly requestMethod: string;
  readonly requestBody: string | null;
};

export type ApiDocsEndpointRequest = ApiDocsEndpointRequestOk | ApiDocsEndpointRequestError;

export function createApiDocsEndpointRequest(input: {
  readonly endpoint: ApiEndpoint;
  readonly pathParameterValues: Record<string, string>;
  readonly queryParameterValues: Record<string, string>;
  readonly requestBodyValue: string;
  readonly apiBase: string;
  readonly requestUrl: URL;
  readonly t: ApiDocsTranslate;
}): ApiDocsEndpointRequest {
  const resolvedPath = resolveApiDocsPathWithParameters(input.endpoint, input.pathParameterValues);
  if (!resolvedPath) {
    return {
      ok: false,
      state: "errorNonRetryable",
      message: input.t("apiDocs.tester.invalidPath"),
    };
  }

  const queryString = buildApiDocsQueryString(
    input.endpoint.queryParameters,
    input.queryParameterValues,
  );
  const payloadText = input.requestBodyValue.trim();
  const shouldSendBody = input.endpoint.requestBodyRequired || payloadText.length > 0;
  const parsedBody = shouldSendBody
    ? safeParseJson(payloadText.length > 0 ? payloadText : "{}")
    : null;

  if (shouldSendBody && parsedBody === null) {
    return {
      ok: false,
      state: "errorNonRetryable",
      message: input.t("apiDocs.tester.requestFailure"),
    };
  }

  return {
    ok: true,
    endpointUrl: resolveApiEndpoint(
      input.apiBase,
      input.requestUrl,
      `${resolvedPath}${queryString}`,
    ),
    requestMethod: input.endpoint.method.toUpperCase(),
    requestBody: shouldSendBody ? JSON.stringify(parsedBody) : null,
  };
}

export async function fetchApiDocsEndpointResponse(input: {
  readonly endpointUrl: string;
  readonly requestMethod: string;
  readonly requestBody: string | null;
  readonly t: ApiDocsTranslate;
}): Promise<FetchEndpointResult> {
  const method = toClientApiHttpMethod(input.requestMethod);
  if (!method) {
    return {
      ok: false,
      errorMessage: input.t("apiDocs.tester.requestFailure"),
    };
  }

  const startedAt = Date.now();
  return requestResolvedApiRaw(input.endpointUrl, {
    method,
    headers: {
      Accept: "application/json",
      ...(input.requestBody ? { "Content-Type": "application/json" } : {}),
    },
    ...(input.requestBody ? { body: input.requestBody } : {}),
    responseType: "text",
  }).then(
    (response) => {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const body =
        typeof response._data === "string" ? response._data : JSON.stringify(response._data ?? "");
      return {
        ok: true,
        payload: {
          statusCode: response.status,
          statusText: response.statusText,
          headers,
          body,
          durationMs: Date.now() - startedAt,
          url: input.endpointUrl,
          method: input.requestMethod,
        } satisfies FetchEndpointResultOk,
      };
    },
    () => ({
      ok: false,
      errorMessage: input.t("apiDocs.tester.requestFailure"),
    }),
  );
}
