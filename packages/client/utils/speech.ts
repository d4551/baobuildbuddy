import { AI_CHAT_VOICE_DEFAULT_LOCALE } from "@bao/shared";

/**
 * Resolves the browser speech recognition constructor when available.
 *
 * @returns SpeechRecognition constructor or null when unsupported.
 */
export function resolveSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (import.meta.server || typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

/**
 * Resolves the browser speech synthesis instance when available.
 *
 * @returns SpeechSynthesis instance or null when unsupported.
 */
export function resolveSpeechSynthesis(): SpeechSynthesis | null {
  if (import.meta.server || typeof window === "undefined") {
    return null;
  }

  return typeof window.speechSynthesis === "undefined" ? null : window.speechSynthesis;
}

/**
 * Normalizes a locale for browser speech APIs with a safe fallback.
 *
 * @param locale Preferred locale from UI state.
 * @returns Locale accepted by speech APIs.
 */
export function resolveSpeechLocale(locale?: string | null): string {
  if (typeof locale !== "string") {
    return AI_CHAT_VOICE_DEFAULT_LOCALE;
  }

  const trimmedLocale = locale.trim();
  return trimmedLocale.length > 0 ? trimmedLocale : AI_CHAT_VOICE_DEFAULT_LOCALE;
}
