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

/** Build server STT routing options from persisted speech settings. */
export const createServerSttRequestOptions = (
  appSettings: SpeechSettingsReader,
): ServerSttRequestOptions => {
  const stt = appSettings.value?.automationSettings?.speech?.stt;
  return {
    provider: resolveSpeechSttProvider(stt?.provider),
    model: stt?.model?.trim() || "",
    endpoint: stt?.endpoint?.trim() || "",
  };
};
