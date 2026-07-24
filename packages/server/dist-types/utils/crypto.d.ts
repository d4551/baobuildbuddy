/**
 * Hash a raw API key using SHA-256 via Bun.CryptoHasher.
 * Only the hash is persisted. Verification compares hashes.
 */
export declare function hashApiKey(rawKey: string): string;
/**
 * Compare a raw API key against a stored hash using SHA-256 + timingSafeEqual.
 */
export declare function verifyApiKey(rawKey: string, storedHash: string): boolean;
/**
 * Encrypt a provider API key for at-rest storage.
 * Uses AES-256-GCM with BAO_ENCRYPTION_KEY from env.
 * Returns "enc:" prefixed base64: iv + ciphertext + authTag.
 *
 * If BAO_ENCRYPTION_KEY is not set, throws — no plaintext fallback.
 */
export declare function encryptProviderKey(plaintext: string): string;
/**
 * Decrypt a provider API key from at-rest storage.
 * Expects "enc:" prefixed base64: iv + ciphertext + authTag.
 */
export declare function decryptProviderKey(ciphertext: string): string;
/**
 * Check if BAO_ENCRYPTION_KEY is available for encryption operations.
 */
export declare function isEncryptionAvailable(): boolean;
