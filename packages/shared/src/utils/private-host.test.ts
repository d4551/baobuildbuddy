/**
 * SSRF gate coverage for the loopback / RFC 1918 host check.
 *
 * The 172.16.0.0/12 branch previously compared the first octet against an
 * arithmetic expression that evaluated to 180, so every 172.16–172.31 address
 * was treated as public. Nothing exercised that range, so the hole was silent.
 */
import { describe, expect, test } from "bun:test";
import { COUNT_SIXTEEN, COUNT_THIRTY_ONE } from "../constants/numeric";
import { isLoopbackOrPrivateHost } from "./private-host";

describe("isLoopbackOrPrivateHost", () => {
  test("blocks loopback hosts", () => {
    for (const hostname of ["localhost", "127.0.0.1", "127.10.20.30", "app.localhost"]) {
      expect(isLoopbackOrPrivateHost(hostname)).toBe(true);
    }
  });

  test("blocks RFC 1918 10.0.0.0/8", () => {
    for (const hostname of ["10.0.0.1", "10.255.255.254"]) {
      expect(isLoopbackOrPrivateHost(hostname)).toBe(true);
    }
  });

  test("blocks RFC 1918 192.168.0.0/16", () => {
    expect(isLoopbackOrPrivateHost("192.168.1.1")).toBe(true);
  });

  test("blocks every second octet of RFC 1918 172.16.0.0/12", () => {
    for (let secondOctet = COUNT_SIXTEEN; secondOctet <= COUNT_THIRTY_ONE; secondOctet += 1) {
      expect(isLoopbackOrPrivateHost(`172.${String(secondOctet)}.0.1`)).toBe(true);
    }
  });

  test("allows public addresses just outside 172.16.0.0/12", () => {
    expect(isLoopbackOrPrivateHost("172.15.0.1")).toBe(false);
    expect(isLoopbackOrPrivateHost("172.32.0.1")).toBe(false);
  });

  test("allows ordinary public hosts", () => {
    for (const hostname of ["example.com", "8.8.8.8", "203.0.113.10"]) {
      expect(isLoopbackOrPrivateHost(hostname)).toBe(false);
    }
  });
});
