import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  HTTP_STATUS_BAD_GATEWAY,
} from "@bao/shared/constants/http";
import { t } from "elysia";

export const speechTranscribeBodySchema = t.Object(
  {
    audioBase64: t.String({ minLength: 1 }),
    mimeType: t.String({ minLength: 3, maxLength: 120 }),
    filename: t.Optional(t.String({ minLength: 1, maxLength: 240 })),
  },
  { required: ["audioBase64", "mimeType"] },
);

export type SpeechTranscribeBody = {
  audioBase64: string;
  mimeType: string;
  filename?: string;
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

export const speechSynthesizeBodySchema = t.Object(
  {
    text: t.String({ minLength: 1, maxLength: 2_000 }),
    voice: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
  },
  { required: ["text"] },
);

export type SpeechSynthesizeBody = {
  text: string;
  voice?: string;
};

export const speechSynthesizeResponses = {
  [HTTP_STATUS_OK]: t.Object(
    {
      audioBase64: t.String(),
      mimeType: t.Literal("audio/wav"),
      provider: t.String(),
      model: t.String(),
      voice: t.String(),
      bytes: t.Number(),
      message: t.String(),
    },
    { required: ["audioBase64", "mimeType", "provider", "model", "voice", "bytes", "message"] },
  ),
  [HTTP_STATUS_BAD_REQUEST]: t.Object({ error: t.String() }, { required: ["error"] }),
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: t.Object({ error: t.String() }, { required: ["error"] }),
  [HTTP_STATUS_BAD_GATEWAY]: t.Object({ error: t.String() }, { required: ["error"] }),
};
