import type { VoiceSettings } from "@bao/shared/types/interview";
import type { Ref } from "vue";
import { resolveSpeechLocale, resolveSpeechSynthesis } from "~/utils/speech";

interface TTSState {
  isSpeaking: Ref<boolean>;
  isPaused: Ref<boolean>;
  error: Ref<string | null>;
  voices: Ref<SpeechSynthesisVoice[]>;
}

interface TTSContext {
  settings?: Ref<VoiceSettings | undefined>;
  state: TTSState;
  synthesis: SpeechSynthesis | null;
}

function createTTSState(): TTSState {
  return {
    isSpeaking: ref(false),
    isPaused: ref(false),
    error: ref<string | null>(null),
    voices: ref<SpeechSynthesisVoice[]>([]),
  };
}

function resolveContextSynthesis(context: TTSContext): SpeechSynthesis | null {
  const resolved = context.synthesis ?? resolveSpeechSynthesis();
  if (resolved) {
    context.synthesis = resolved;
  }
  return resolved;
}

function loadVoices(context: TTSContext): SpeechSynthesisVoice[] {
  const synthesis = resolveContextSynthesis(context);
  if (!synthesis) {
    context.state.voices.value = [];
    return [];
  }

  const availableVoices = synthesis.getVoices();
  context.state.voices.value = availableVoices;
  return availableVoices;
}

function resolveVoiceById(
  voices: readonly SpeechSynthesisVoice[],
  id: string,
): SpeechSynthesisVoice | undefined {
  const normalizedId = id.toLowerCase();
  return voices.find(
    (voice) =>
      voice.voiceURI === id || voice.name === id || voice.name.toLowerCase().includes(normalizedId),
  );
}

function createUtterance(
  context: TTSContext,
  text: string,
  opts?: Partial<Pick<VoiceSettings, "voiceId" | "rate" | "pitch" | "volume" | "language">>,
): SpeechSynthesisUtterance {
  const persisted: Partial<VoiceSettings> = context.settings?.value ?? {};
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts?.rate ?? persisted.rate ?? 1;
  utterance.pitch = opts?.pitch ?? persisted.pitch ?? 1;
  utterance.volume = Math.max(0, Math.min(1, opts?.volume ?? persisted.volume ?? 1));
  utterance.lang = resolveSpeechLocale(opts?.language ?? persisted.language);

  const voiceId = opts?.voiceId ?? persisted.voiceId;
  if (voiceId) {
    const voice = resolveVoiceById(context.state.voices.value, voiceId);
    if (voice) {
      utterance.voice = voice;
    }
  }

  utterance.onstart = () => {
    context.state.isSpeaking.value = true;
    context.state.isPaused.value = false;
    context.state.error.value = null;
  };
  utterance.onend = () => {
    context.state.isSpeaking.value = false;
    context.state.isPaused.value = false;
  };
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    context.state.error.value = event.error;
    context.state.isSpeaking.value = false;
    context.state.isPaused.value = false;
  };

  return utterance;
}

function createTTSActions(context: TTSContext) {
  const speak = (
    text: string,
    opts?: Partial<Pick<VoiceSettings, "voiceId" | "rate" | "pitch" | "volume" | "language">>,
  ): void => {
    const synthesis = resolveContextSynthesis(context);
    if (!synthesis) {
      return;
    }
    synthesis.cancel();
    synthesis.speak(createUtterance(context, text, opts));
  };

  const pause = (): void => {
    if (context.synthesis && context.state.isSpeaking.value) {
      context.synthesis.pause();
      context.state.isPaused.value = true;
    }
  };

  const resume = (): void => {
    if (context.synthesis && context.state.isPaused.value) {
      context.synthesis.resume();
      context.state.isPaused.value = false;
    }
  };

  const cancel = (): void => {
    if (context.synthesis) {
      context.synthesis.cancel();
    }
    context.state.isSpeaking.value = false;
    context.state.isPaused.value = false;
  };

  return {
    speak,
    pause,
    resume,
    cancel,
  };
}

/**
 * Web Speech API Text-to-Speech composable.
 * Supports VoiceSettings: voiceId, rate, pitch, volume, language.
 */
export function useTTS(settings?: Ref<VoiceSettings | undefined>) {
  const context: TTSContext = {
    settings,
    state: createTTSState(),
    synthesis: null,
  };

  onMounted(() => {
    const synthesis = resolveContextSynthesis(context);
    if (!synthesis) {
      return;
    }
    synthesis.onvoiceschanged = () => {
      loadVoices(context);
    };
    loadVoices(context);
  });

  const isSupported = computed(() => resolveContextSynthesis(context) !== null);
  const actions = createTTSActions(context);

  return {
    ...actions,
    isSpeaking: readonly(context.state.isSpeaking),
    isPaused: readonly(context.state.isPaused),
    error: readonly(context.state.error),
    voices: readonly(context.state.voices),
    isSupported: readonly(isSupported),
    loadVoices: () => loadVoices(context),
  };
}
