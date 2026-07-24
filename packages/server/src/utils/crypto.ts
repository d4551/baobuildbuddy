const NUM_32 = 32;
const NUM_4 = 4;
/**
 * Cryptographic primitives for API key hashing and provider key encryption.
 * Uses Bun-native APIs and node:crypto exclusively. No external dependencies.
 */

import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config/env";

const ENCRYPTION_KEY_RAW = config.encryptionKey;
const ENCRYPTION_KEY_BYTES: Buffer | null = ENCRYPTION_KEY_RAW
  ? Buffer.from(ENCRYPTION_KEY_RAW.padEnd(NUM_32, "\0").slice(0, NUM_32), "utf8")
  : null;

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_ALGORITHM = "aes-256-gcm" as const;

/**
 * Hash a raw API key using SHA-256 via Bun.CryptoHasher.
 * Only the hash is persisted. Verification compares hashes.
 */
export function hashApiKey(rawKey: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(rawKey);
  return hasher.digest("base64");
}

/**
 * Compare a raw API key against a stored hash using SHA-256 + timingSafeEqual.
 */
export function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const computed = Buffer.from(hashApiKey(rawKey));
  const expected = Buffer.from(storedHash);
  if (computed.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(computed, expected);
}

/**
 * Encrypt a provider API key for at-rest storage.
 * Uses AES-256-GCM with BAO_ENCRYPTION_KEY from env.
 * Returns "enc:" prefixed base64: iv + ciphertext + authTag.
 *
 * If BAO_ENCRYPTION_KEY is not set, throws — no plaintext fallback.
 */
export function encryptProviderKey(plaintext: string): string {
  if (!ENCRYPTION_KEY_BYTES) {
    throw new Error("BAO_ENCRYPTION_KEY must be set to encrypt provider keys");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY_BYTES, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return `enc:${combined.toString("base64")}`;
}

/**
 * Decrypt a provider API key from at-rest storage.
 * Expects "enc:" prefixed base64: iv + ciphertext + authTag.
 */
export function decryptProviderKey(ciphertext: string): string {
  if (!ENCRYPTION_KEY_BYTES) {
    throw new Error("BAO_ENCRYPTION_KEY must be set to decrypt provider keys");
  }
  if (!ciphertext.startsWith("enc:")) {
    throw new Error("Ciphertext missing encryption prefix");
  }
  const combined = Buffer.from(ciphertext.slice(NUM_4), "base64");
  const iv = combined.subarray(0, IV_LENGTH);
  const ct = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY_BYTES, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/**
 * Check if BAO_ENCRYPTION_KEY is available for encryption operations.
 */
export function isEncryptionAvailable(): boolean {
  return ENCRYPTION_KEY_BYTES !== null;
}
