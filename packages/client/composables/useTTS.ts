import type { VoiceSettings } from "@bao/shared";

/**
 * Web Speech API Text-to-Speech composable.
 * Supports VoiceSettings: voiceId, rate, pitch, volume, language.
 */
export function useTTS(settings?: Ref<VoiceSettings | undefined>) {
  const isSpeaking = ref(false);
  const isPaused = ref(false);
  const error = ref<string | null>(null);
  const voices = ref<SpeechSynthesisVoice[]>([]);

  let synthesis: SpeechSynthesis | null = null;

  function loadVoices(): SpeechSynthesisVoice[] {
    if (import.meta.server) return [];
    const v = speechSynthesis.getVoices();
    voices.value = v;
    return v;
  }

  onMounted(() => {
    if (import.meta.server) return;
    synthesis = speechSynthesis;
    synthesis.onvoiceschanged = () => loadVoices();
    loadVoices();
  });

  const voiceById = (id: string): SpeechSynthesisVoice | undefined =>
    voices.value.find(
      (v) => v.voiceURI === id || v.name === id || v.name.toLowerCase().includes(id.toLowerCase()),
    );

  const isSupported = computed(() => {
    if (import.meta.server) return false;
    return typeof speechSynthesis !== "undefined";
  });

  function speak(
    text: string,
    opts?: Partial<Pick<VoiceSettings, "voiceId" | "rate" | "pitch" | "volume" | "language">>,
  ) {
    if (import.meta.server || !synthesis) return;

    synthesis.cancel();
    const s: Partial<VoiceSettings> = settings?.value ?? {};
    const rate = opts?.rate ?? s.rate ?? 1;
    const pitch = opts?.pitch ?? s.pitch ?? 1;
    const volume = opts?.volume ?? s.volume ?? 1;
    const lang = opts?.language ?? s.language ?? "en-US";
    const voiceId = opts?.voiceId ?? s.voiceId;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = Math.max(0, Math.min(1, volume));
    utterance.lang = lang;
    if (voiceId) {
      const voice = voiceById(voiceId);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => {
      isSpeaking.value = true;
      isPaused.value = false;
      error.value = null;
    };
    utterance.onend = () => {
      isSpeaking.value = false;
      isPaused.value = false;
    };
    utterance.onerror = (e) => {
      error.value = String(e);
      isSpeaking.value = false;
      isPaused.value = false;
    };

    synthesis.speak(utterance);
  }

  function pause() {
    if (synthesis && isSpeaking.value) {
      synthesis.pause();
      isPaused.value = true;
    }
  }

  function resume() {
    if (synthesis && isPaused.value) {
      synthesis.resume();
      isPaused.value = false;
    }
  }

  function cancel() {
    if (synthesis) {
      synthesis.cancel();
      isSpeaking.value = false;
      isPaused.value = false;
    }
  }

  return {
    speak,
    pause,
    resume,
    cancel,
    isSpeaking: readonly(isSpeaking),
    isPaused: readonly(isPaused),
    error: readonly(error),
    voices: readonly(voices),
    isSupported: readonly(isSupported),
    loadVoices,
  };
}
