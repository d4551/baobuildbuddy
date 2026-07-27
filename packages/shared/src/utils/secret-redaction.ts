/**
 * Redaction for credential-shaped tokens in boundary error text.
 *
 * AI provider SDKs echo the offending credential back inside their error
 * messages ("Invalid API key sk-proj-…"). Those messages flow into structured
 * logs and, historically, into whatever the caller chose to surface. The client
 * response was already scrubbed by mapping to a fixed `API_ERROR_*` constant,
 * but the log line kept the raw message — so a rejected generation wrote a live
 * provider key into the log at error level, where it gets shipped and retained.
 *
 * Redaction happens here rather than at each log call so there is one place to
 * add a provider prefix, and so no future call site can forget.
 */

/** Replacement written in place of a matched credential. */
export const REDACTED_SECRET_PLACEHOLDER = "[redacted]";

/**
 * Credential shapes recognised for redaction.
 *
 * Ordered specific-prefix-first inside a single alternation so `sk-proj-…` and
 * `sk-ant-…` are consumed by their own branch before the generic `sk-…` branch.
 * Each branch requires a minimum token length so ordinary prose ("sk-" in a
 * sentence, a bare "Bearer") is never rewritten.
 */
const CREDENTIAL_PATTERN = new RegExp(
  [
    // OpenAI project and Anthropic keys (explicit prefixes before the generic form).
    "sk-proj-[A-Za-z0-9_-]{8,}",
    "sk-ant-[A-Za-z0-9_-]{8,}",
    // Generic OpenAI-style secret key.
    "sk-[A-Za-z0-9_-]{16,}",
    // Google AI Studio / Gemini.
    "AIza[A-Za-z0-9_-]{20,}",
    // Hugging Face access token.
    "hf_[A-Za-z0-9]{16,}",
    // Groq.
    "gsk_[A-Za-z0-9]{16,}",
    // This application's own API keys (AUTH_KEY_PREFIX).
    "bao_[A-Za-z0-9_-]{16,}",
    // Any Authorization bearer value, whatever the issuer.
    "[Bb]earer\\s+[A-Za-z0-9._~+/-]{12,}={0,2}",
  ].join("|"),
  "gu",
);

/**
 * Replaces credential-shaped substrings with a fixed placeholder.
 *
 * @param text Arbitrary text that may embed a credential.
 * @returns The text with every recognised credential replaced.
 */
export function redactSecrets(text: string): string {
  CREDENTIAL_PATTERN.lastIndex = 0;
  return text.replace(CREDENTIAL_PATTERN, REDACTED_SECRET_PLACEHOLDER);
}

/**
 * Reports whether text still contains a credential-shaped substring.
 *
 * Exported for tests and gates that must assert a payload is clean rather than
 * trust that redaction ran.
 *
 * @param text Text to inspect.
 * @returns True when a recognised credential shape is present.
 */
export function containsSecret(text: string): boolean {
  CREDENTIAL_PATTERN.lastIndex = 0;
  return CREDENTIAL_PATTERN.test(text);
}
