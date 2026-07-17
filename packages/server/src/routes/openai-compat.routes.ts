import { Elysia, type status } from "elysia";
import { OPENAI_COMPAT_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { authGuard } from "../middleware/auth";
import { corsPlugin } from "../middleware/cors";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  type OpenAICompatChatCompletionsBody,
  openaiCompatChatCompletionsBodySchema,
  openaiCompatChatCompletionsResponses,
  openaiCompatModelGetResponses,
  openaiCompatModelsListResponses,
} from "./openai-compat-route-contracts";
import {
  createOpenAICompatChatCompletion,
  createOpenAICompatChatCompletionStream,
  getOpenAICompatModel,
  listOpenAICompatModels,
} from "./openai-compat-route-support";

type RouteStatus = typeof status;

/**
 * OpenAI-compatible Chat Completions facade for external SDK clients.
 * Mounted at `/v1` (not under `/api`) so `baseURL` can be `http://host:3000/v1`.
 */
export const openaiCompatRoutes = new Elysia({
  name: "openai-compat",
  prefix: OPENAI_COMPAT_ENDPOINT_PREFIX,
})
  .use(corsPlugin)
  .use(authGuard)
  .use(
    rateLimit({
      duration: MS_PER_MINUTE,
      max: 60,
      name: "openai-compat-rate-limit",
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .get(
    "/models",
    {
      detail: { tags: ["OpenAI Compatible"] },
      response: openaiCompatModelsListResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      const data = await listOpenAICompatModels();
      return status(HTTP_STATUS_OK, { object: "list" as const, data });
    },
  )
  .get(
    "/models/*",
    {
      detail: { tags: ["OpenAI Compatible"] },
      response: openaiCompatModelGetResponses,
    },
    async ({
      params,
      status,
    }: {
      params: { "*": string };
      status: RouteStatus;
    }) => {
      const modelId = decodeURIComponent(params["*"] ?? "");
      const result = await getOpenAICompatModel(modelId);
      return status(result.status, result.body);
    },
  )
  .post(
    "/chat/completions",
    {
      detail: { tags: ["OpenAI Compatible"] },
      body: openaiCompatChatCompletionsBodySchema,
      response: openaiCompatChatCompletionsResponses,
    },
    async ({
      body,
      status,
    }: {
      body: OpenAICompatChatCompletionsBody;
      status: RouteStatus;
    }) => {
      if (body.stream) {
        return createOpenAICompatChatCompletionStream(body);
      }
      const result = await createOpenAICompatChatCompletion(body);
      return status(result.status, result.body);
    },
  );
