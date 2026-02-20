import type { AIChatVoiceErrorCode, ChatMessage } from "@bao/shared";
import {
  AI_CHAT_VOICE_ERROR_MESSAGE_KEYS,
  AI_CHAT_VOICE_AUTO_SPEAK_DEFAULT,
  AI_CHAT_VOICE_DEFAULT_ID,
  STATE_KEYS,
} from "@bao/shared";
import type { Ref } from "vue";
import { computed, getCurrentScope, onScopeDispose, watch } from "vue";
import { resolveSpeechLocale } from "../utils/speech";
import { useNuxtState } from "./nuxtRuntime";
import { useSpeech } from "./useSpeech";

/**
 * Input and message refs needed to bind voice controls to a chat surface.
 */
export interface UseChatVoiceOptions {
  draft: Ref<string>;
  locale: Ref<string>;
  messages: Readonly<Ref<ChatMessage[]>>;
}

/**
 * Resolves the most recent assistant message with non-empty content.
 *
 * @param messages Chat message history.
 * @returns Latest assistant message content or empty string.
 */
function resolveLatestAssistantMessage(messages: readonly ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) {
      continue;
    }

    if (message.role !== "assistant") {
      continue;
    }

    const trimmedContent = message.content.trim();
    if (trimmedContent.length > 0) {
      return trimmedContent;
    }
  }

  return "";
}

/**
 * Resolves the i18n key for a canonical speech error code.
 *
 * @param value Canonical voice error code.
 * @returns Translation key path or empty string.
 */
function resolveSpeechErrorMessageKey(
  value: AIChatVoiceErrorCode | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  return AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[value];
}

/**
 * Resolves the i18n key for voice feature support hints.
 *
 * @param supportsRecognition Whether browser speech recognition is available.
 * @param supportsSynthesis Whether browser speech synthesis is available.
 * @returns Translation key path or empty string when all voice features are available.
 */
function resolveVoiceSupportHintKey(
  supportsRecognition: boolean,
  supportsSynthesis: boolean,
): string {
  if (supportsRecognition && supportsSynthesis) {
    return "";
  }

  if (!supportsRecognition && !supportsSynthesis) {
    return "aiChatCommon.voice.unsupportedHint";
  }

  if (!supportsRecognition) {
    return "aiChatCommon.voice.recognitionUnsupportedHint";
  }

  return "aiChatCommon.voice.synthesisUnsupportedHint";
}

/**
 * Resolves a speech synthesis voice by ID.
 *
 * @param voiceId Persisted voice identifier.
 * @param voices Available browser voices.
 * @returns Matching browser voice when available.
 */
function resolveVoiceById(
  voiceId: string,
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const trimmedVoiceId = voiceId.trim();
  if (trimmedVoiceId.length === 0) {
    return undefined;
  }

  return voices.find((voice) => voice.voiceURI === trimmedVoiceId);
}

/**
 * Resolves a locale-matching fallback voice for synthesis.
 *
 * @param locale Current UI locale.
 * @param voices Available browser voices.
 * @returns Locale-aligned fallback voice.
 */
function resolveLocaleVoice(
  locale: string,
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const normalizedLocale = resolveSpeechLocale(locale).toLowerCase();
  const [languagePrefix = ""] = normalizedLocale.split("-");
  const localePrefix = `${languagePrefix}-`;

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLocale) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(localePrefix)) ??
    voices.find((voice) => voice.default) ??
    voices.at(0)
  );
}

/**
 * Voice controls shared by floating chat and full chat page.
 *
 * @param options Chat input and message refs.
 * @returns Reactive voice controls and status values.
 */
export function useChatVoice(options: UseChatVoiceOptions) {
  const speech = useSpeech();
  const autoSpeakReplies = useNuxtState<boolean>(
    STATE_KEYS.AI_CHAT_AUTO_SPEAK,
    () => AI_CHAT_VOICE_AUTO_SPEAK_DEFAULT,
  );
  const selectedVoiceId = useNuxtState<string>(
    STATE_KEYS.AI_CHAT_VOICE_ID,
    () => AI_CHAT_VOICE_DEFAULT_ID,
  );
  const voices = computed(() => speech.voices.value);

  const latestAssistantMessage = computed(() =>
    resolveLatestAssistantMessage(options.messages.value),
  );
  const canReplayAssistant = computed(
    () => speech.supportsSynthesis.value && latestAssistantMessage.value.length > 0,
  );
  const errorMessageKey = computed(() => resolveSpeechErrorMessageKey(speech.error.value));
  const supportHintKey = computed(() =>
    resolveVoiceSupportHintKey(
      speech.supportsRecognition.value,
      speech.supportsSynthesis.value,
    ),
  );

  watch(
    [voices, () => options.locale.value],
    ([availableVoices, localeValue]) => {
      if (availableVoices.length === 0) {
        selectedVoiceId.value = AI_CHAT_VOICE_DEFAULT_ID;
        return;
      }

      const selectedVoice = resolveVoiceById(selectedVoiceId.value, availableVoices);
      if (selectedVoice) {
        return;
      }

      const fallbackVoice = resolveLocaleVoice(localeValue, availableVoices);
      selectedVoiceId.value = fallbackVoice?.voiceURI ?? AI_CHAT_VOICE_DEFAULT_ID;
    },
    { immediate: true },
  );

  watch(
    () => speech.fullTranscript.value,
    (transcriptValue) => {
      if (transcriptValue.length === 0) {
        return;
      }
      options.draft.value = transcriptValue;
    },
  );

  watch(
    () => options.messages.value.length,
    (nextLength, previousLength) => {
      if (
        !speech.supportsSynthesis.value ||
        !autoSpeakReplies.value ||
        nextLength <= previousLength
      ) {
        return;
      }

      const newestMessage = options.messages.value.at(-1);
      if (!newestMessage || newestMessage.role !== "assistant") {
        return;
      }

      const trimmedContent = newestMessage.content.trim();
      if (trimmedContent.length === 0) {
        return;
      }

      const selectedVoice = resolveVoiceById(selectedVoiceId.value, voices.value);
      speech.speak(trimmedContent, {
        lang: resolveSpeechLocale(options.locale.value),
        ...(selectedVoice ? { voice: selectedVoice } : {}),
      });
    },
  );

  function startListening(): boolean {
    if (!speech.supportsRecognition.value) {
      return false;
    }

    return speech.startListening(resolveSpeechLocale(options.locale.value));
  }

  function stopListening(): void {
    speech.stopListening();
  }

  function toggleListening(): boolean {
    if (speech.isListening.value) {
      stopListening();
      return true;
    }

    return startListening();
  }

  function speakLatestAssistantMessage(): boolean {
    if (!canReplayAssistant.value) {
      return false;
    }

    const selectedVoice = resolveVoiceById(selectedVoiceId.value, voices.value);
    speech.speak(latestAssistantMessage.value, {
      lang: resolveSpeechLocale(options.locale.value),
      ...(selectedVoice ? { voice: selectedVoice } : {}),
    });
    return true;
  }

  const cleanup = () => {
    speech.stopListening();
    speech.stopSpeaking();
  };

  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    autoSpeakReplies,
    selectedVoiceId,
    voices,
    canReplayAssistant,
    errorMessageKey,
    supportHintKey,
    isListening: speech.isListening,
    isSpeaking: speech.isSpeaking,
    supportsRecognition: speech.supportsRecognition,
    supportsSynthesis: speech.supportsSynthesis,
    isSupported: speech.isSupported,
    startListening,
    stopListening,
    toggleListening,
    speakLatestAssistantMessage,
  };
}
