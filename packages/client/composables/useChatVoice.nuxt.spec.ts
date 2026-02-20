import {
  AI_CHAT_VOICE_ERROR_CODES,
  AI_CHAT_VOICE_DEFAULT_ID,
  STATE_KEYS,
  type AIChatVoiceErrorCode,
  type ChatMessage,
} from "@bao/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref, type Ref } from "vue";

const autoSpeakState = ref(false);
const selectedVoiceState = ref(AI_CHAT_VOICE_DEFAULT_ID);

const fullTranscript = ref("");
const speechError = ref<AIChatVoiceErrorCode | null>(null);
const isListening = ref(false);
const isSpeaking = ref(false);
const supportsRecognition = ref(true);
const supportsSynthesis = ref(true);
const voices = ref<SpeechSynthesisVoice[]>([]);
const isSupported = computed(() => supportsRecognition.value || supportsSynthesis.value);

const speak = vi.fn();
const startListening = vi.fn(() => true);
const stopListening = vi.fn();
const stopSpeaking = vi.fn();

function useNuxtStateMock(
  key: typeof STATE_KEYS.AI_CHAT_AUTO_SPEAK,
  initializer?: () => boolean,
): Ref<boolean>;
function useNuxtStateMock(
  key: typeof STATE_KEYS.AI_CHAT_VOICE_ID,
  initializer?: () => string,
): Ref<string>;
function useNuxtStateMock(
  key: string,
  initializer?: () => boolean | string,
): Ref<boolean | string> {
  void initializer;

  if (key === STATE_KEYS.AI_CHAT_AUTO_SPEAK) {
    return autoSpeakState;
  }

  if (key === STATE_KEYS.AI_CHAT_VOICE_ID) {
    return selectedVoiceState;
  }

  throw new Error(`Unsupported state key: ${key}`);
}

vi.mock("./nuxtRuntime", () => ({
  useNuxtState: useNuxtStateMock,
}));

vi.mock("./useSpeech", () => ({
  useSpeech: () => ({
    fullTranscript,
    error: speechError,
    isListening,
    isSpeaking,
    supportsRecognition,
    supportsSynthesis,
    isSupported,
    voices,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
  }),
}));

const { useChatVoice } = await import("./useChatVoice");

function resetSpeechState() {
  fullTranscript.value = "";
  speechError.value = null;
  isListening.value = false;
  isSpeaking.value = false;
  supportsRecognition.value = true;
  supportsSynthesis.value = true;
  voices.value = [];
  autoSpeakState.value = false;
  selectedVoiceState.value = AI_CHAT_VOICE_DEFAULT_ID;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetSpeechState();
});

describe("useChatVoice", () => {
  it("resolves canonical speech error code to i18n message key", async () => {
    const draft = ref("");
    const locale = ref("en-US");
    const messages = ref<ChatMessage[]>([]);
    const chatVoice = useChatVoice({ draft, locale, messages });

    expect(chatVoice.errorMessageKey.value).toBe("");

    speechError.value = AI_CHAT_VOICE_ERROR_CODES.network;
    await nextTick();

    expect(chatVoice.errorMessageKey.value).toBe("aiChatCommon.voice.errors.network");
  });

  it("mirrors speech transcript into draft input", async () => {
    const draft = ref("");
    const locale = ref("en-US");
    const messages = ref<ChatMessage[]>([]);
    useChatVoice({ draft, locale, messages });

    fullTranscript.value = "Draft from speech";
    await nextTick();

    expect(draft.value).toBe("Draft from speech");
  });

  it("uses selected voice when replaying latest assistant message", async () => {
    const fallbackVoice: SpeechSynthesisVoice = {
      voiceURI: "voice-en-us",
      name: "Voice EN",
      lang: "en-US",
      localService: true,
      default: true,
    };
    voices.value = [fallbackVoice];

    const draft = ref("");
    const locale = ref("en-US");
    const messages = ref<ChatMessage[]>([
      {
        role: "assistant",
        content: "Latest assistant reply",
        timestamp: new Date().toISOString(),
      },
    ]);
    const chatVoice = useChatVoice({ draft, locale, messages });

    await nextTick();
    expect(chatVoice.selectedVoiceId.value).toBe("voice-en-us");
    expect(chatVoice.canReplayAssistant.value).toBe(true);

    const replayed = chatVoice.speakLatestAssistantMessage();
    expect(replayed).toBe(true);
    expect(speak).toHaveBeenCalledWith(
      "Latest assistant reply",
      expect.objectContaining({
        lang: "en-US",
        voice: expect.objectContaining({ voiceURI: "voice-en-us" }),
      }),
    );
  });

  it("blocks startListening when speech recognition is unsupported", () => {
    supportsRecognition.value = false;

    const draft = ref("");
    const locale = ref("en-US");
    const messages = ref<ChatMessage[]>([]);
    const chatVoice = useChatVoice({ draft, locale, messages });

    const started = chatVoice.startListening();
    expect(started).toBe(false);
    expect(startListening).not.toHaveBeenCalled();
  });
});
