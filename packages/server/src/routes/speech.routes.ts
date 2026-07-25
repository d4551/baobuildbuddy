import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  API_MESSAGE_SPEECH_SYNTHESIZED,
  API_MESSAGE_SPEECH_TRANSCRIBED,
} from "@bao/shared/constants/api-messages";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { MS_PER_MINUTE } from "@bao/shared/constants/time";
import { Elysia } from "elysia";
import { synthesizeSpeechAudio } from "../services/speech/speech-synthesize-service";
import { transcribeSpeechAudio } from "../services/speech/speech-transcribe-service";
import { openapiDetail } from "../utils/openapi-detail";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  speechSynthesizeBodySchema,
  speechSynthesizeResponses,
  speechTranscribeBodySchema,
  speechTranscribeResponses,
} from "./speech-route-contracts";

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
      detail: openapiDetail(
        "Speech",
        "Transcribe uploaded audio via the configured speech-to-text provider (Whisper-compatible).",
      ),
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
  )
  .post(
    toApiChildPath(API_ENDPOINTS.speechBase, API_ENDPOINTS.speechSynthesize),
    {
      detail: openapiDetail(
        "Speech",
        "Synthesize speech with local on-device Kokoro TTS (OpenAI-compatible /v1/audio/speech).",
      ),
      body: speechSynthesizeBodySchema,
      response: speechSynthesizeResponses,
    },
    async ({ body, status }) => {
      const result = await synthesizeSpeechAudio(body);
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
        audioBase64: result.audioBase64,
        mimeType: result.mimeType,
        provider: result.provider,
        model: result.model,
        voice: result.voice,
        bytes: result.bytes,
        message: API_MESSAGE_SPEECH_SYNTHESIZED,
      });
    },
  );
