import { decryptProviderKey, isEncryptionAvailable } from "./crypto";

interface ProviderKeysRow {
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  claudeApiKey: string | null;
  huggingfaceToken: string | null;
  emailTransportPassword: string | null;
}

interface DecryptedProviderKeys {
  geminiApiKey: string | null;
  openaiApiKey: string | null;
  claudeApiKey: string | null;
  huggingfaceToken: string | null;
  emailTransportPassword: string | null;
}

function maybeDecrypt(value: string | null): string | null {
  if (!value) return null;
  if (!isEncryptionAvailable()) return value;
  if (!value.startsWith("enc:")) return value;
  return decryptProviderKey(value);
}

export function decryptProviderKeys(row: ProviderKeysRow): DecryptedProviderKeys {
  return {
    geminiApiKey: maybeDecrypt(row.geminiApiKey),
    openaiApiKey: maybeDecrypt(row.openaiApiKey),
    claudeApiKey: maybeDecrypt(row.claudeApiKey),
    huggingfaceToken: maybeDecrypt(row.huggingfaceToken),
    emailTransportPassword: maybeDecrypt(row.emailTransportPassword),
  };
}
