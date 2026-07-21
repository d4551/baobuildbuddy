import { API_MESSAGE_SPEECH_TRANSCRIBED } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { Elysia } from "elysia";
import { transcribeSpeechAudio } from "../services/speech/speech-transcribe-service";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import { speechTranscribeBodySchema, speechTranscribeResponses } from "./speech-route-contracts";

export const speechRoutes = new Elysia({ prefix: toApiScopedPath(API_ENDPOINTS.speechBase) })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: MS_PER_MINUTE,
      max: 30,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .post(
    toApiChildPath(API_ENDPOINTS.speechBase, API_ENDPOINTS.speechTranscribe),
    {
      detail: { tags: ["Speech"] },
      body: speechTranscribeBodySchema,
      response: speechTranscribeResponses,
    },
    async ({ body, status }) => {
      const result = await transcribeSpeechAudio(body);
      if (!result.ok) {
        if (result.status === HTTP_STATUS_BAD_REQUEST) {
          return status(HTTP_STATUS_BAD_REQUEST, { error: result.error });
        }
        if (result.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
          return status(HTTP_STATUS_UNPROCESSABLE_ENTITY, { error: result.error });
        }
        return status(HTTP_STATUS_BAD_GATEWAY, { error: result.error });
      }
      return status(HTTP_STATUS_OK, {
        text: result.text,
        provider: result.provider,
        model: result.model,
        message: API_MESSAGE_SPEECH_TRANSCRIBED,
      });
    },
  );
