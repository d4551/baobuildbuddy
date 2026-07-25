import {
  AI_CHAT_VOICE_AUTO_SPEAK_DEFAULT,
  AI_CHAT_VOICE_DEFAULT_ID,
  AI_CHAT_VOICE_ERROR_MESSAGE_KEYS,
  type AIChatVoiceErrorCode,
} from "@bao/shared/constants/ai-voice";
import { STATE_KEYS } from "@bao/shared/constants/state-keys";
import type { ChatMessage } from "@bao/shared/types/ai";
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
  messages: Readonly<Ref<readonly ChatMessage[]>>;
}

interface VoiceWatchInput {
  speech: ReturnType<typeof useSpeech>;
  locale: Ref<string>;
  messages: Readonly<Ref<readonly ChatMessage[]>>;
  draft: Ref<string>;
  autoSpeakReplies: Ref<boolean>;
  selectedVoiceId: Ref<string>;
  voices: Readonly<Ref<readonly SpeechSynthesisVoice[]>>;
}

interface VoiceActionInput {
  speech: ReturnType<typeof useSpeech>;
  locale: Ref<string>;
  selectedVoiceId: Ref<string>;
  voices: Readonly<Ref<readonly SpeechSynthesisVoice[]>>;
  latestAssistantMessage: Readonly<Ref<string>>;
  canReplayAssistant: Readonly<Ref<boolean>>;
}

interface VoiceComputedState {
  autoSpeakReplies: Ref<boolean>;
  selectedVoiceId: Ref<string>;
  voices: Readonly<Ref<readonly SpeechSynthesisVoice[]>>;
  latestAssistantMessage: Readonly<Ref<string>>;
  canReplayAssistant: Readonly<Ref<boolean>>;
  errorMessageKey: Readonly<Ref<string>>;
  supportHintKey: Readonly<Ref<string>>;
}

interface SpeakVoiceInput {
  speech: ReturnType<typeof useSpeech>;
  text: string;
  locale: string;
  selectedVoiceId: string;
  voices: readonly SpeechSynthesisVoice[];
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
    if (message?.role !== "assistant") {
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
function resolveSpeechErrorMessageKey(value: AIChatVoiceErrorCode | null | undefined): string {
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

  if (!(supportsRecognition || supportsSynthesis)) {
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
    return;
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

function resolveSelectedVoice(
  selectedVoiceId: string,
  locale: string,
  voices: readonly SpeechSynthesisVoice[],
): string {
  if (voices.length === 0) {
    return AI_CHAT_VOICE_DEFAULT_ID;
  }

  const selectedVoice = resolveVoiceById(selectedVoiceId, voices);
  if (selectedVoice) {
    return selectedVoiceId;
  }

  return resolveLocaleVoice(locale, voices)?.voiceURI ?? AI_CHAT_VOICE_DEFAULT_ID;
}

function speakWithSelectedVoice(input: SpeakVoiceInput): void {
  const selectedVoice = resolveVoiceById(input.selectedVoiceId, input.voices);
  input.speech.speak(input.text, {
    lang: resolveSpeechLocale(input.locale),
    ...(selectedVoice ? { voice: selectedVoice } : {}),
  });
}

function registerVoiceWatchers(input: VoiceWatchInput): void {
  watch(
    [input.voices, () => input.locale.value],
    ([availableVoices, localeValue]) => {
      input.selectedVoiceId.value = resolveSelectedVoice(
        input.selectedVoiceId.value,
        localeValue,
        availableVoices,
      );
    },
    { immediate: true },
  );

  watch(
    () => input.speech.fullTranscript.value,
    (transcriptValue) => {
      if (transcriptValue.length > 0) {
        input.draft.value = transcriptValue;
      }
    },
  );

  watch(
    () => input.messages.value.length,
    (nextLength, previousLength) => {
      if (!(input.speech.supportsSynthesis.value && input.autoSpeakReplies.value)) {
        return;
      }
      if (nextLength <= previousLength) {
        return;
      }
      const newestMessage = input.messages.value.at(-1);
      if (newestMessage?.role !== "assistant") {
        return;
      }
      const trimmedContent = newestMessage.content.trim();
      if (trimmedContent.length > 0) {
        speakWithSelectedVoice({
          speech: input.speech,
          text: trimmedContent,
          locale: input.locale.value,
          selectedVoiceId: input.selectedVoiceId.value,
          voices: input.voices.value,
        });
      }
    },
  );
}

function createVoiceActions(input: VoiceActionInput) {
  const startListening = (): boolean => {
    if (!input.speech.supportsRecognition.value) {
      return false;
    }
    return input.speech.startListening(resolveSpeechLocale(input.locale.value));
  };

  const stopListening = (): void => {
    input.speech.stopListening();
  };

  const toggleListening = (): boolean => {
    if (input.speech.isListening.value) {
      stopListening();
      return true;
    }
    return startListening();
  };

  const speakLatestAssistantMessage = (): boolean => {
    if (!input.canReplayAssistant.value) {
      return false;
    }
    speakWithSelectedVoice({
      speech: input.speech,
      text: input.latestAssistantMessage.value,
      locale: input.locale.value,
      selectedVoiceId: input.selectedVoiceId.value,
      voices: input.voices.value,
    });
    return true;
  };

  /** On-device TTS sample — does not require an assistant message (Web Speech API). */
  const testOnDeviceTts = (): boolean => {
    if (!input.speech.supportsSynthesis.value) {
      return false;
    }
    speakWithSelectedVoice({
      speech: input.speech,
      text: "On-device text to speech is working.",
      locale: input.locale.value,
      selectedVoiceId: input.selectedVoiceId.value,
      voices: input.voices.value,
    });
    return true;
  };

  return {
    startListening,
    stopListening,
    toggleListening,
    speakLatestAssistantMessage,
    testOnDeviceTts,
  };
}

function createVoiceComputedState(
  options: UseChatVoiceOptions,
  speech: ReturnType<typeof useSpeech>,
): VoiceComputedState {
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

  return {
    autoSpeakReplies,
    selectedVoiceId,
    voices,
    latestAssistantMessage,
    canReplayAssistant,
    errorMessageKey: computed(() => resolveSpeechErrorMessageKey(speech.error.value)),
    supportHintKey: computed(() =>
      resolveVoiceSupportHintKey(speech.supportsRecognition.value, speech.supportsSynthesis.value),
    ),
  };
}

/**
 * Voice controls shared by floating chat and full chat page.
 *
 * @param options Chat input and message refs.
 * @returns Reactive voice controls and status values.
 */
export function useChatVoice(options: UseChatVoiceOptions) {
  const speech = useSpeech();
  const state = createVoiceComputedState(options, speech);

  registerVoiceWatchers({
    speech,
    locale: options.locale,
    messages: options.messages,
    draft: options.draft,
    autoSpeakReplies: state.autoSpeakReplies,
    selectedVoiceId: state.selectedVoiceId,
    voices: state.voices,
  });
  const actions = createVoiceActions({
    speech,
    locale: options.locale,
    selectedVoiceId: state.selectedVoiceId,
    voices: state.voices,
    latestAssistantMessage: state.latestAssistantMessage,
    canReplayAssistant: state.canReplayAssistant,
  });

  const cleanup = () => {
    speech.stopListening();
    speech.stopSpeaking();
  };
  if (getCurrentScope()) {
    onScopeDispose(cleanup);
  }

  return {
    autoSpeakReplies: state.autoSpeakReplies,
    selectedVoiceId: state.selectedVoiceId,
    voices: state.voices,
    canReplayAssistant: state.canReplayAssistant,
    errorMessageKey: state.errorMessageKey,
    supportHintKey: state.supportHintKey,
    isListening: speech.isListening,
    isSpeaking: speech.isSpeaking,
    supportsRecognition: speech.supportsRecognition,
    supportsSynthesis: speech.supportsSynthesis,
    isSupported: speech.isSupported,
    ...actions,
  };
}
