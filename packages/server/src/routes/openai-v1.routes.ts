import { Elysia } from "elysia";
import { OPENAI_V1_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { authGuard } from "../middleware/auth";
import { corsPlugin } from "../middleware/cors";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  openaiV1ChatCompletionsBodySchema,
  openaiV1ModelsListResponses,
} from "./openai-v1-route-contracts";
import {
  createOpenAIV1ChatCompletion,
  createOpenAIV1ChatCompletionStream,
  getOpenAIV1Model,
  listOpenAIV1Models,
} from "./openai-v1-route-support";

/**
 * OpenAI Chat Completions API surface for external SDK clients.
 * Mounted at OPENAI_V1_ENDPOINT_PREFIX alongside the main API app.
 */
export const openaiV1Routes = new Elysia({
  name: "openai-v1",
  prefix: OPENAI_V1_ENDPOINT_PREFIX,
})
  .use(corsPlugin)
  .use(authGuard)
  .use(
    rateLimit({
      duration: MS_PER_MINUTE,
      max: 60,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .get(
    "/models",
    {
      detail: { tags: ["OpenAI V1"] },
      response: openaiV1ModelsListResponses,
    },
    async ({ status }) => {
      const data = await listOpenAIV1Models();
      return status(HTTP_STATUS_OK, { object: "list" as const, data });
    },
  )
  .get(
    "/models/*",
    {
      detail: { tags: ["OpenAI V1"] },
    },
    async ({ params, status }) => {
      const modelId = decodeURIComponent(params["*"] ?? "");
      const result = await getOpenAIV1Model(modelId);
      return status(result.status, result.body);
    },
  )
  .post(
    "/chat/completions",
    {
      detail: { tags: ["OpenAI V1"] },
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
