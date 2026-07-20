import type { SpeechProviderOption } from "@bao/shared/constants/settings";

export const resolveSpeechSttProvider = (
  value: string | null | undefined,
): SpeechProviderOption => {
  if (
    value === "local" ||
    value === "openai" ||
    value === "huggingface" ||
    value === "custom" ||
    value === "browser"
  ) {
    return value;
  }
  return "browser";
};

export const shouldUseServerStt = (provider: SpeechProviderOption): boolean =>
  provider !== "browser";
