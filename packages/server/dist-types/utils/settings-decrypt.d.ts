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
export declare function decryptProviderKeys(row: ProviderKeysRow): DecryptedProviderKeys;
export {};
