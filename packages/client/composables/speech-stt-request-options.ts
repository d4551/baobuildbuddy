import { DEFAULT_SPEECH_SETTINGS } from "@bao/shared/constants/settings";
import type { ServerSttRequestOptions } from "./speech-server-stt";
import { resolveSpeechSttProvider } from "./speech-stt-provider";

type SpeechSettingsReader = {
  value?: {
    automationSettings?: {
      speech?: {
        stt?: {
          provider?: string;
          model?: string;
          endpoint?: string;
        };
      };
    };
  } | null;
};

/** Build server STT routing options from persisted speech settings (defaults filled). */
export const createServerSttRequestOptions = (
  appSettings: SpeechSettingsReader,
): ServerSttRequestOptions => {
  const stt = appSettings.value?.automationSettings?.speech?.stt;
  const provider = resolveSpeechSttProvider(stt?.provider);
  const model = stt?.model?.trim() || DEFAULT_SPEECH_SETTINGS.stt.model;
  const endpoint = stt?.endpoint?.trim() || DEFAULT_SPEECH_SETTINGS.stt.endpoint;
  return { provider, model, endpoint };
};
