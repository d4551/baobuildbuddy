import { afterEach, describe, expect, test } from "bun:test";
import { API_ERROR_JOB_URL_DISALLOWED_HOST } from "@bao/shared/constants/api-errors";
import { sanitizeAndValidateJobUrl } from "./automation-validation";

const PRIVATE_FIXTURE_URL = "http://127.0.0.1:4173/apply";
const PUBLIC_FIXTURE_URL = "https://example.com/jobs/apply";

const originalAllowPrivateHosts = process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;

afterEach(() => {
  if (originalAllowPrivateHosts === undefined) {
    delete process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;
    delete Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;
    return;
  }
  process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = originalAllowPrivateHosts;
  Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = originalAllowPrivateHosts;
});

describe("sanitizeAndValidateJobUrl private-host SSRF gate", () => {
  test("denies loopback hosts by default", () => {
    delete process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;
    delete Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;

    expect(() => sanitizeAndValidateJobUrl(PRIVATE_FIXTURE_URL)).toThrow(
      API_ERROR_JOB_URL_DISALLOWED_HOST,
    );
  });

  test("allows private hosts only when BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS is true", () => {
    process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";
    Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS = "true";

    expect(sanitizeAndValidateJobUrl(PRIVATE_FIXTURE_URL)).toBe(PRIVATE_FIXTURE_URL);
  });

  test("still accepts public https job URLs when private-host opt-in is off", () => {
    delete process.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;
    delete Bun.env.BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS;

    expect(sanitizeAndValidateJobUrl(PUBLIC_FIXTURE_URL)).toBe(PUBLIC_FIXTURE_URL);
  });
});
