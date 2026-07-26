/**
 * Range coverage for the automation SSRF host classifier.
 *
 * `automation-validation.test.ts` exercises the env-gated wrapper with a single
 * loopback address and one public host, so the RFC 1918 and link-local ranges
 * the gate exists to stop had no assertions at all. A boundary regression there
 * silently turns job-apply into an SSRF vector, so every range — and the public
 * addresses immediately outside 172.16.0.0/12 — is pinned here against the pure
 * classifier, which needs no environment mutation.
 */
import { describe, expect, test } from "bun:test";
import { COUNT_SIXTEEN, COUNT_THIRTY_ONE } from "@bao/shared/constants/numeric";
import { isPrivateOrLoopbackAutomationHost } from "./automation-validation";

/** Every second octet of 172.16.0.0/12, both bounds included. */
const RFC1918_CLASS_B_SECOND_OCTETS = Array.from(
  { length: COUNT_THIRTY_ONE - COUNT_SIXTEEN + 1 },
  (_unused, offset) => COUNT_SIXTEEN + offset,
);

describe("isPrivateOrLoopbackAutomationHost", () => {
  test("blocks loopback and localhost forms", () => {
    for (const hostname of ["localhost", "localhost.localdomain", "127.0.0.1", "127.10.20.30"]) {
      expect(isPrivateOrLoopbackAutomationHost(hostname)).toBe(true);
    }
  });

  test("blocks 10.0.0.0/8", () => {
    expect(isPrivateOrLoopbackAutomationHost("10.0.0.1")).toBe(true);
    expect(isPrivateOrLoopbackAutomationHost("10.255.255.254")).toBe(true);
  });

  test("blocks 192.168.0.0/16", () => {
    expect(isPrivateOrLoopbackAutomationHost("192.168.1.1")).toBe(true);
  });

  test("blocks the 169.254.169.254 cloud metadata address", () => {
    expect(isPrivateOrLoopbackAutomationHost("169.254.169.254")).toBe(true);
  });

  test("blocks the full 172.16.0.0/12 range", () => {
    for (const secondOctet of RFC1918_CLASS_B_SECOND_OCTETS) {
      expect(isPrivateOrLoopbackAutomationHost(`172.${String(secondOctet)}.0.1`)).toBe(true);
    }
  });

  test("allows public addresses immediately outside 172.16.0.0/12", () => {
    expect(isPrivateOrLoopbackAutomationHost("172.15.0.1")).toBe(false);
    expect(isPrivateOrLoopbackAutomationHost("172.32.0.1")).toBe(false);
  });

  test("blocks IPv6 loopback and unique-local prefixes", () => {
    for (const hostname of ["::1", "fc00::1", "fd12:3456::1"]) {
      expect(isPrivateOrLoopbackAutomationHost(hostname)).toBe(true);
    }
  });

  test("allows ordinary public hosts", () => {
    for (const hostname of ["example.com", "8.8.8.8", "203.0.113.10"]) {
      expect(isPrivateOrLoopbackAutomationHost(hostname)).toBe(false);
    }
  });

  test("treats an empty hostname as disallowed", () => {
    expect(isPrivateOrLoopbackAutomationHost("")).toBe(true);
  });
});
