import {
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { OPENAI_V1_ENDPOINT_PREFIX, OPENAI_V1_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { Elysia } from "elysia";
import { authenticateApiKey } from "../middleware/auth";
import { corsPlugin } from "../middleware/cors";
import { openapiDetail } from "../utils/openapi-detail";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  openaiV1ChatCompletionsBodySchema,
  openaiV1ModelParamsSchema,
  openaiV1ModelsListResponses,
} from "./openai-v1-route-contracts";
import {
  createOpenAIV1ChatCompletion,
  createOpenAIV1ChatCompletionStream,
  getOpenAIV1Model,
  listOpenAIV1Models,
} from "./openai-v1-route-support";

const resolveOpenAIV1AuthErrorCode = (error: string): string => {
  if (error === API_ERROR_INVALID_API_KEY) {
    return "invalid_api_key";
  }
  if (error === API_ERROR_MISSING_AUTH_HEADER) {
    return "missing_authorization";
  }
  return "invalid_request_error";
};

function toOpenAIV1ChildPath(endpointPath: string): string {
  if (endpointPath === OPENAI_V1_ENDPOINT_PREFIX) {
    return "/";
  }
  if (!endpointPath.startsWith(OPENAI_V1_ENDPOINT_PREFIX)) {
    return endpointPath;
  }
  return endpointPath.slice(OPENAI_V1_ENDPOINT_PREFIX.length) || "/";
}

/**
 * OpenAI Chat Completions API surface for external SDK clients.
 * Mounted at OPENAI_V1_ENDPOINT_PREFIX alongside the main API app.
 */
export const openaiV1Routes = new Elysia({
  name: "openai-v1",
  prefix: OPENAI_V1_ENDPOINT_PREFIX,
})
  .use(corsPlugin)
  .beforeHandle(async ({ request, status }) => {
    const failure = await authenticateApiKey(request);
    if (!failure) {
      return;
    }
    return status(failure.status, {
      error: {
        message: failure.error,
        type: "invalid_request_error",
        code: resolveOpenAIV1AuthErrorCode(failure.error),
      },
    });
  })
  .use(
    rateLimit({
      duration: MS_PER_MINUTE,
      max: 60,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .get(
    toOpenAIV1ChildPath(OPENAI_V1_ENDPOINTS.models),
    {
      detail: openapiDetail(
        "OpenAI V1",
        "List available models through the OpenAI-compatible API.",
      ),
      response: openaiV1ModelsListResponses,
    },
    async ({ status }) => {
      const data = await listOpenAIV1Models();
      return status(HTTP_STATUS_OK, { object: "list" as const, data });
    },
  )
  .get(
    `${toOpenAIV1ChildPath(OPENAI_V1_ENDPOINTS.models)}/:model`,
    {
      detail: openapiDetail(
        "OpenAI V1",
        "Retrieve a single model by id through the OpenAI-compatible API.",
      ),
      params: openaiV1ModelParamsSchema,
    },
    async ({ params, status }) => {
      const result = await getOpenAIV1Model(decodeURIComponent(params.model));
      return status(result.status, result.body);
    },
  )
  .post(
    toOpenAIV1ChildPath(OPENAI_V1_ENDPOINTS.chatCompletions),
    {
      detail: openapiDetail(
        "OpenAI V1",
        "Create a chat completion through the OpenAI-compatible API.",
      ),
      body: openaiV1ChatCompletionsBodySchema,
    },
    async ({ body, status }) => {
      if (body.stream) {
        return createOpenAIV1ChatCompletionStream(body);
      }
      const result = await createOpenAIV1ChatCompletion(body);
      return status(result.status, result.body);
    },
  );
