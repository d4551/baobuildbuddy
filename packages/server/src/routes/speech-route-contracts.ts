import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { t } from "elysia";

export const speechTranscribeBodySchema = t.Object(
  {
    audioBase64: t.String({ minLength: 1 }),
    mimeType: t.String({ minLength: 3, maxLength: 120 }),
    filename: t.Optional(t.String({ minLength: 1, maxLength: 240 })),
    provider: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
    model: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
    endpoint: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  },
  { required: ["audioBase64", "mimeType"] },
);

export type SpeechTranscribeBody = {
  audioBase64: string;
  mimeType: string;
  filename?: string;
  provider?: string;
  model?: string;
  endpoint?: string;
};

export const speechTranscribeResponses = {
  [HTTP_STATUS_OK]: t.Object(
    {
      text: t.String(),
      provider: t.String(),
      model: t.String(),
      message: t.String(),
    },
    { required: ["text", "provider", "model", "message"] },
  ),
  [HTTP_STATUS_BAD_REQUEST]: t.Object({ error: t.String() }, { required: ["error"] }),
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: t.Object({ error: t.String() }, { required: ["error"] }),
  [HTTP_STATUS_BAD_GATEWAY]: t.Object({ error: t.String() }, { required: ["error"] }),
};
