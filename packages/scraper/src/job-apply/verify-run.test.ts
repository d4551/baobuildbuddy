import { describe, expect, test } from "bun:test";
import { assertVerifySubmitHostAllowed } from "./verify-run";

const PUBLIC_HOST_REJECTION_PATTERN = /not a loopback or private host/u;

describe("assertVerifySubmitHostAllowed", () => {
  test("allows loopback and private hosts", () => {
    expect(() => assertVerifySubmitHostAllowed("http://127.0.0.1:3000/jobs/1")).not.toThrow();
    expect(() => assertVerifySubmitHostAllowed("http://localhost:3000/jobs/1")).not.toThrow();
    expect(() => assertVerifySubmitHostAllowed("http://[::1]:3000/jobs/1")).not.toThrow();
    expect(() => assertVerifySubmitHostAllowed("http://10.0.0.5/apply")).not.toThrow();
    expect(() => assertVerifySubmitHostAllowed("http://172.16.0.10/apply")).not.toThrow();
    expect(() => assertVerifySubmitHostAllowed("http://192.168.1.20:8080/apply")).not.toThrow();
  });

  test("throws for public hosts before candidate PII is submitted", () => {
    expect(() =>
      assertVerifySubmitHostAllowed("https://boards.greenhouse.io/studio/jobs/1"),
    ).toThrow(PUBLIC_HOST_REJECTION_PATTERN);
    expect(() => assertVerifySubmitHostAllowed("https://example.com/careers")).toThrow(
      PUBLIC_HOST_REJECTION_PATTERN,
    );
    expect(() => assertVerifySubmitHostAllowed("https://8.8.8.8/submit")).toThrow(
      PUBLIC_HOST_REJECTION_PATTERN,
    );
  });
});
