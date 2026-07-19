import { describe, expect, test } from "bun:test";
import { encryptProviderKey, hashApiKey, isEncryptionAvailable, verifyApiKey } from "./crypto";

describe("provider key crypto", () => {
  test("verifyApiKey accepts matching hash and rejects mismatch", () => {
    const raw = "bao_test_api_key_value_001";
    const hash = hashApiKey(raw);
    expect(verifyApiKey(raw, hash)).toEqual(true);
    expect(verifyApiKey(`${raw}-tampered`, hash)).toEqual(false);
    expect(verifyApiKey(raw, `${hash}x`)).toEqual(false);
  });

  test("encryptProviderKey writes enc-prefixed ciphertext when test encryption key is present", () => {
    expect(isEncryptionAvailable()).toEqual(true);
    const ciphertext = encryptProviderKey("provider-secret-material");
    expect(ciphertext.startsWith("enc:")).toEqual(true);
  });
});
